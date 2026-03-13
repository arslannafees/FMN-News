import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import cron from 'node-cron';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fmn-dev-secret-change-in-production';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// VAPID keys setup for push notifications
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.SMTP_USER || 'admin@fmnnews.co'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Nodemailer transporter
const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;

// Auth middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' }) as unknown as void;
    try {
        (req as express.Request & { admin: object }).admin = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Superadmin-only middleware
const superadminMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' }) as unknown as void;
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
        if (payload.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin access required' }) as unknown as void;
        (req as express.Request & { admin: object }).admin = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Cron: auto-publish scheduled articles every minute
cron.schedule('* * * * *', async () => {
    try {
        await prisma.article.updateMany({
            where: { status: 'scheduled', publishAt: { lte: new Date() } },
            data: { status: 'published' }
        });
    } catch { /* silent */ }
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Main route
app.get('/', (req, res) => {
    res.send('FMN News Agency API is running...');
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' }) as unknown as void;
        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' }) as unknown as void;
        const token = jwt.sign({ id: admin.id, username, role: admin.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: admin.role });
    } catch {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Change own password (any logged-in admin)
app.put('/api/admin/profile/password', authMiddleware, async (req, res) => {
    try {
        const payload = (req as express.Request & { admin: { id: string } }).admin;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' }) as unknown as void;
        if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' }) as unknown as void;
        const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
        if (!admin) return res.status(404).json({ error: 'Account not found' }) as unknown as void;
        const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' }) as unknown as void;
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.admin.update({ where: { id: payload.id }, data: { passwordHash } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Account management (superadmin only)
app.get('/api/admin/accounts', superadminMiddleware, async (req, res) => {
    try {
        const accounts = await prisma.admin.findMany({ select: { id: true, username: true, role: true } });
        res.json(accounts);
    } catch {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

app.post('/api/admin/accounts', superadminMiddleware, async (req, res) => {
    try {
        const { username, password, role = 'admin' } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' }) as unknown as void;
        if (!['admin', 'superadmin'].includes(role)) return res.status(400).json({ error: 'Invalid role' }) as unknown as void;
        const existing = await prisma.admin.findUnique({ where: { username } });
        if (existing) return res.status(409).json({ error: 'Username already exists' }) as unknown as void;
        const passwordHash = await bcrypt.hash(password, 12);
        const account = await prisma.admin.create({ data: { id: crypto.randomUUID(), username, passwordHash, role } });
        res.status(201).json({ id: account.id, username: account.username, role: account.role });
    } catch {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

app.delete('/api/admin/accounts/:id', superadminMiddleware, async (req, res) => {
    try {
        const payload = (req as express.Request & { admin: { id: string } }).admin;
        if (payload.id === req.params.id) return res.status(400).json({ error: 'Cannot delete your own account' }) as unknown as void;
        await prisma.admin.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// View count endpoint
app.post('/api/articles/:id/view', async (req, res) => {
    try {
        await prisma.article.update({
            where: { id: req.params.id },
            data: { views: { increment: 1 } }
        });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to record view' });
    }
});

// Most-read endpoint
app.get('/api/articles/most-read', async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'published' },
            orderBy: { views: 'desc' },
            take: 5,
            include: { comment: true },
        });
        res.json(articles);
    } catch {
        res.status(500).json({ error: 'Failed to fetch most read' });
    }
});

// Author Endpoints
app.get('/api/authors', async (req, res) => {
    try {
        const authors = await prisma.author.findMany({ orderBy: { name: 'asc' } });
        res.json(authors);
    } catch {
        res.status(500).json({ error: 'Failed to fetch authors' });
    }
});

app.get('/api/authors/:id', async (req, res) => {
    try {
        const author = await prisma.author.findUnique({
            where: { id: req.params.id },
            include: { articles: { include: { comment: true }, orderBy: { createdAt: 'desc' } } }
        });
        if (!author) return res.status(404).json({ error: 'Author not found' }) as unknown as void;
        res.json(author);
    } catch {
        res.status(500).json({ error: 'Failed to fetch author' });
    }
});

app.post('/api/authors', authMiddleware, async (req, res) => {
    try {
        const author = await prisma.author.create({ data: { ...req.body, id: crypto.randomUUID() } });
        res.status(201).json(author);
    } catch {
        res.status(400).json({ error: 'Failed to create author' });
    }
});

app.put('/api/authors/:id', authMiddleware, async (req, res) => {
    try {
        const author = await prisma.author.update({ where: { id: req.params.id }, data: req.body });
        res.json(author);
    } catch {
        res.status(400).json({ error: 'Failed to update author' });
    }
});

app.delete('/api/authors/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.author.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete author' });
    }
});

// Newsletter Endpoints
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' }) as unknown as void;
        const token = crypto.randomUUID();
        await prisma.subscriber.upsert({
            where: { email },
            create: { id: crypto.randomUUID(), email, token },
            update: { token }
        });
        if (mailer) {
            const siteUrl = process.env.SITE_URL || 'https://fmnnews.co';
            await mailer.sendMail({
                from: `"FMN News" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Confirm your FMN News subscription',
                html: `<p>Click <a href="${siteUrl}/api/subscribe/confirm/${token}">here</a> to confirm your subscription to FMN News.</p>`
            });
        }
        res.json({ message: 'Subscription initiated. Check your email to confirm.' });
    } catch {
        res.status(400).json({ error: 'Subscription failed' });
    }
});

app.get('/api/subscribe/confirm/:token', async (req, res) => {
    try {
        const sub = await prisma.subscriber.findFirst({ where: { token: req.params.token } });
        if (!sub) return res.status(404).send('Invalid confirmation link') as unknown as void;
        await prisma.subscriber.update({ where: { id: sub.id }, data: { confirmed: true, token: null } });
        res.send('<h2>Subscription confirmed! Welcome to FMN News.</h2>');
    } catch {
        res.status(500).send('Confirmation failed');
    }
});

app.post('/api/newsletter/send', authMiddleware, async (req, res) => {
    try {
        if (!mailer) return res.status(400).json({ error: 'Email not configured' }) as unknown as void;
        const { subject, html } = req.body;
        const subscribers = await prisma.subscriber.findMany({ where: { confirmed: true } });
        await Promise.allSettled(subscribers.map(sub =>
            mailer!.sendMail({ from: `"FMN News" <${process.env.SMTP_USER}>`, to: sub.email, subject, html })
        ));
        res.json({ sent: subscribers.length });
    } catch {
        res.status(500).json({ error: 'Newsletter send failed' });
    }
});

// Push Notification Endpoints
app.post('/api/push/subscribe', async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        await prisma.pushsubscription.upsert({
            where: { id: endpoint.slice(-36) },
            create: { id: crypto.randomUUID(), endpoint, p256dh: keys.p256dh, auth: keys.auth },
            update: { endpoint, p256dh: keys.p256dh, auth: keys.auth }
        });
        res.status(201).json({ message: 'Subscribed' });
    } catch {
        res.status(400).json({ error: 'Failed to subscribe' });
    }
});

app.post('/api/push/send', authMiddleware, async (req, res) => {
    try {
        if (!process.env.VAPID_PUBLIC_KEY) return res.status(400).json({ error: 'Push not configured' }) as unknown as void;
        const { title, body, url } = req.body;
        const subs = await prisma.pushsubscription.findMany();
        const payload = JSON.stringify({ title, body, url: url || '/' });
        const results = await Promise.allSettled(subs.map(s =>
            webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        ));
        const failed = results.filter(r => r.status === 'rejected').length;
        res.json({ sent: subs.length - failed, failed });
    } catch {
        res.status(500).json({ error: 'Push send failed' });
    }
});

// Articles Endpoints
app.get('/api/articles', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 0;
        const limit = parseInt(req.query.limit as string) || 0;

        const queryOptions: Parameters<typeof prisma.article.findMany>[0] = {
            include: { comment: true },
            orderBy: { createdAt: 'desc' },
        };

        if (limit > 0) {
            queryOptions.take = limit;
            queryOptions.skip = page > 0 ? (page - 1) * limit : 0;
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany(queryOptions),
            limit > 0 ? prisma.article.count() : Promise.resolve(0),
        ]);

        if (limit > 0) {
            res.json({ articles, total, page: page || 1, totalPages: Math.ceil(total / limit) });
        } else {
            res.json(articles);
        }
    } catch {
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

app.get('/api/articles/search', async (req, res) => {
    try {
        const q = (req.query.q as string || '').trim();
        if (!q) return res.json([]);

        // Use full-text search if available, otherwise fall back to LIKE
        const articles = await prisma.article.findMany({
            where: {
                status: 'published',
                OR: [
                    { title: { contains: q } },
                    { excerpt: { contains: q } },
                    { content: { contains: q } },
                    { category: { contains: q } },
                    { author: { contains: q } },
                    { tags: { contains: q } },
                ]
            },
            include: { comment: true },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        res.json(articles);
    } catch {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.post('/api/articles', async (req, res) => {
    try {
        const article = await prisma.article.create({
            data: {
                ...req.body,
                id: crypto.randomUUID(),
                updatedAt: new Date()
            },
        });
        res.status(201).json(article);
    } catch {
        res.status(400).json({ error: 'Failed to create article' });
    }
});

app.put('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const article = await prisma.article.update({
            where: { id },
            data: req.body,
        });
        res.json(article);
    } catch {
        res.status(400).json({ error: 'Failed to update article' });
    }
});

app.delete('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.article.delete({ where: { id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete article' });
    }
});

// Video Stories Endpoints
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await prisma.videostory.findMany();
        res.json(videos);
    } catch {
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

app.post('/api/videos', async (req, res) => {
    try {
        const video = await prisma.videostory.create({
            data: {
                ...req.body,
                id: crypto.randomUUID()
            }
        });
        res.status(201).json(video);
    } catch {
        res.status(400).json({ error: 'Failed to create video' });
    }
});

app.put('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const video = await prisma.videostory.update({
            where: { id },
            data: req.body,
        });
        res.json(video);
    } catch {
        res.status(400).json({ error: 'Failed to update video' });
    }
});

app.delete('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.videostory.delete({ where: { id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete video' });
    }
});

// Trending Topics Endpoints
app.get('/api/trending', async (req, res) => {
    try {
        const topics = await prisma.trendingtopic.findMany();
        res.json(topics);
    } catch {
        res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
});

app.post('/api/trending', async (req, res) => {
    try {
        const topic = await prisma.trendingtopic.create({
            data: {
                ...req.body,
                id: crypto.randomUUID()
            }
        });
        res.status(201).json(topic);
    } catch {
        res.status(400).json({ error: 'Failed to create topic' });
    }
});

app.delete('/api/trending/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.trendingtopic.delete({ where: { id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete topic' });
    }
});

// Breaking News Endpoints
app.get('/api/breaking-news', async (req, res) => {
    try {
        const news = await prisma.breakingnews.findMany();
        res.json(news.map(n => n.text));
    } catch {
        res.status(500).json({ error: 'Failed to fetch breaking news' });
    }
});

app.post('/api/breaking-news', async (req, res) => {
    try {
        const news = await prisma.breakingnews.create({ data: req.body });
        res.status(201).json(news);
    } catch {
        res.status(400).json({ error: 'Failed to add breaking news' });
    }
});

// Comments Endpoints
app.post('/api/articles/:articleId/comments', async (req, res) => {
    try {
        const { articleId } = req.params;
        const comment = await prisma.comment.create({
            data: { ...req.body, id: crypto.randomUUID(), articleId },
            include: { replies: true }
        });
        res.status(201).json(comment);
    } catch {
        res.status(400).json({ error: 'Failed to add comment' });
    }
});

app.post('/api/comments/:id/upvote', async (req, res) => {
    try {
        const comment = await prisma.comment.update({
            where: { id: req.params.id },
            data: { upvotes: { increment: 1 } }
        });
        res.json({ upvotes: comment.upvotes });
    } catch {
        res.status(400).json({ error: 'Failed to upvote' });
    }
});

app.delete('/api/comments/:id', async (req, res) => {
    try {
        await prisma.comment.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete comment' });
    }
});

// Live Blog Endpoints
app.get('/api/liveblog/:articleId', async (req, res) => {
    try {
        const lb = await prisma.liveblog.findUnique({
            where: { articleId: req.params.articleId },
            include: { updates: { orderBy: { timestamp: 'desc' } } }
        });
        if (!lb) return res.status(404).json({ error: 'Not found' }) as unknown as void;
        res.json(lb);
    } catch {
        res.status(500).json({ error: 'Failed to fetch live blog' });
    }
});

app.post('/api/liveblog', authMiddleware, async (req, res) => {
    try {
        const lb = await prisma.liveblog.create({
            data: { ...req.body, id: crypto.randomUUID() },
            include: { updates: true }
        });
        res.status(201).json(lb);
    } catch {
        res.status(400).json({ error: 'Failed to create live blog' });
    }
});

app.patch('/api/liveblog/:id', authMiddleware, async (req, res) => {
    try {
        const lb = await prisma.liveblog.update({
            where: { id: req.params.id },
            data: req.body,
            include: { updates: { orderBy: { timestamp: 'desc' } } }
        });
        res.json(lb);
    } catch {
        res.status(400).json({ error: 'Failed to update live blog' });
    }
});

app.post('/api/liveblog/:id/updates', authMiddleware, async (req, res) => {
    try {
        const update = await prisma.liveblogupdate.create({
            data: { ...req.body, id: crypto.randomUUID(), liveblogId: req.params.id }
        });
        res.status(201).json(update);
    } catch {
        res.status(400).json({ error: 'Failed to add update' });
    }
});

app.delete('/api/liveblog/updates/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.liveblogupdate.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete update' });
    }
});


// Category RSS Feed
app.get('/feed/:category.xml', async (req, res) => {
    try {
        const category = req.params.category;
        const articles = await prisma.article.findMany({
            where: { status: 'published', category: { equals: category, mode: 'insensitive' } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const siteUrl = process.env.SITE_URL || 'https://fmnnews.co';
        const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/article/${a.id}</link>
      <guid isPermaLink="true">${siteUrl}/article/${a.id}</guid>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${a.excerpt}]]></description>
      <category>${a.category}</category>
      <author>${a.author}</author>
    </item>`).join('');
        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>FMN News – ${category}</title>
    <link>${siteUrl}/category/${category.toLowerCase()}</link>
    <description>FMN News ${category} feed</description>
    <language>en-us</language>
    ${items}
</channel></rss>`);
    } catch {
        res.status(500).send('Failed to generate feed');
    }
});

// RSS Feed
app.get('/feed.xml', async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'published' },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const siteUrl = process.env.SITE_URL || 'https://fmnnews.co';
        const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/article/${a.id}</link>
      <guid isPermaLink="true">${siteUrl}/article/${a.id}</guid>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${a.excerpt}]]></description>
      <category>${a.category}</category>
      <author>${a.author}</author>
    </item>`).join('');
        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FMN News</title>
    <link>${siteUrl}</link>
    <description>FMN News - Breaking News and Analysis from Pakistan and the World</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`);
    } catch {
        res.status(500).send('Failed to generate feed');
    }
});

const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
    console.log(`FMN News Agency API is now live at http://${HOST}:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
});
