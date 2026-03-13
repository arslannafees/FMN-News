import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
    const dataPath = path.resolve(__dirname, '../../src/data/initialData.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Data file not found at ${dataPath}`);
    }

    const initialData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log('Seeding Articles...');
    for (const article of initialData.articles) {
        await prisma.article.upsert({
            where: { id: article.id },
            update: {},
            create: {
                id: article.id,
                title: article.title,
                excerpt: article.excerpt,
                content: article.content || article.excerpt,
                category: article.category,
                author: article.author,
                image: article.image,
                time: article.time,
                readTime: article.readTime,
                featured: article.featured || false,
                isBreaking: article.isBreaking || false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    console.log('Seeding Videos...');
    for (const video of initialData.videoStories) {
        await prisma.videostory.upsert({
            where: { id: video.id },
            update: {},
            create: {
                id: video.id,
                title: video.title,
                duration: video.duration,
                image: video.image,
                url: video.url,
            },
        });
    }

    console.log('Seeding Trending Topics...');
    for (const topic of initialData.trendingTopics) {
        await prisma.trendingtopic.upsert({
            where: { id: topic.id },
            update: {},
            create: {
                id: topic.id,
                tag: topic.tag,
                count: topic.count,
                size: topic.size,
            },
        });
    }

    console.log('Seeding Breaking News...');
    for (const news of initialData.breakingNews) {
        const existing = await prisma.breakingnews.findFirst({ where: { text: news } });
        if (!existing) {
            await prisma.breakingnews.create({
                data: { text: news },
            });
        }
    }

    console.log('Seeding Admin Account...');
    const passwordHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
    await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            id: 'admin-default',
            username: 'admin',
            passwordHash: passwordHash,
        },
    });

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
