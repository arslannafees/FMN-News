import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main route
app.get('/', (req, res) => {
    res.send('FMN News Agency API is running...');
});

// Articles Endpoints
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            include: { comment: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(articles);
    } catch {
        res.status(500).json({ error: 'Failed to fetch' });
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
            data: {
                ...req.body,
                id: crypto.randomUUID(),
                articleId,
            }
        });
        res.status(201).json(comment);
    } catch {
        res.status(400).json({ error: 'Failed to add comment' });
    }
});

app.delete('/api/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.comment.delete({ where: { id } });
        res.status(204).send();
    } catch {
        res.status(400).json({ error: 'Failed to delete comment' });
    }
});


const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
    console.log(`FMN News Agency API is now live at http://${HOST}:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
});
