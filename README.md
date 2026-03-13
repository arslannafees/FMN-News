# 📰 FMN News

A modern, full-featured **news website and content management platform** built for FMN News — your trusted source for breaking news, in-depth analysis, and global perspectives from Islamabad, Pakistan.

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Express-5.2-000000?logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql" alt="MySQL"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/License-Private-red" alt="License"/>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/PWA-Ready-brightgreen" alt="PWA Ready"/>
  <img src="https://img.shields.io/badge/Push_Notifications-Enabled-blue" alt="Push Notifications"/>
  <img src="https://img.shields.io/badge/Live_Blog-Supported-orange" alt="Live Blog"/>
  <img src="https://img.shields.io/badge/RSS_Feeds-Available-yellow" alt="RSS Feeds"/>
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#️-database-schema)
- [Tech Stack](#️-tech-stack)
- [API Reference](#-api-reference)
- [Environment Variables](#️-environment-variables)
- [Admin Roles & Permissions](#-admin-roles--permissions)
- [Market Data](#-market-data)
- [Push Notifications & RSS](#-push-notifications--rss)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contact](#-contact)

---

## ✨ Features

### 📰 Content Management

| Feature | Description |
|---------|-------------|
| **Article Editor** | Rich article creation with title, content, excerpt, category, tags, featured image, caption, and credits |
| **Article Scheduling** | Schedule articles to publish at a future date/time via cron jobs |
| **Article Types** | Distinguish article categories: News, Analysis, Feature, and more |
| **Article Series** | Multi-part article series with part numbering support |
| **Fact Checking** | Attach fact-check verdicts and last-verified dates |
| **Breaking News** | Mark articles as breaking news; displayed in a live ticker |
| **Featured Articles** | Pin articles as featured for homepage prominence |
| **View Count Tracking** | Record and display total views per article |
| **Tag System** | Flexible tag-based article organization with archive pages |
| **Draft / Published / Scheduled** | Full article lifecycle management |
| **Image Uploads** | Multer-powered file uploads (up to 10 MB) served statically |

### 📖 Reader Experience

- **Article Detail Page** — Full article with related metadata, reading time, author info, and social sharing
- **Table of Contents** — Auto-generated TOC for long-form articles
- **Image Lightbox** — Click-to-expand inline images
- **Text Selection Popup** — Highlight text to share or annotate
- **Sticky Share Sidebar** — Social share buttons that follow the reader
- **Most-Read Sidebar** — Top 5 articles by view count
- **Article Reactions** — Reader reaction buttons on articles
- **Comment Section** — Nested comments with upvoting and delete support
- **Saved Articles** — Save articles locally to read later
- **Reading Time** — Estimated reading time shown on each article

### 🔴 Live Blog

- **Live Blog Posts** — Real-time updates attached to a specific article
- **Update Stream** — Add timestamped updates visible to readers in real time
- **Live Blog Management** — Admin controls to create, update, and delete blog posts and individual updates

### 📊 Market Data

- **Forex Rates** — Live exchange rates for 30+ currencies
- **Cryptocurrency** — Real-time data for 10+ coins via Coinpaprika API
- **Market Indices** — Global stock market indices
- **Commodities & Bonds** — Prices for key global commodities
- **Charts** — Line and candlestick charts for visual trend analysis
- **Market Pulse Component** — Compact ticker strip with trend indicators

### 🔔 Push Notifications & Subscriptions

- **Web Push Notifications** — Send breaking news alerts directly to subscribers' browsers
- **Newsletter Subscriptions** — Email subscription with double opt-in confirmation via Nodemailer
- **RSS Feeds** — Main site-wide feed and per-category feeds for content distribution

### 🎬 Video Stories

- **Video Management** — Upload and manage short video stories with thumbnails, title, and duration
- **Video Player Component** — Embedded playback for video content on the site

### 🛠️ Admin Dashboard

- **Article Management** — Create, edit, delete, publish, schedule, and manage all articles
- **Author Management** — Create and manage author profiles with bio, avatar, and social links
- **Video Story Management** — Add, edit, or remove video stories
- **Trending Topics** — Manage trending hashtag/topic cards with popularity counts
- **Breaking News** — Control breaking news ticker items
- **Newsletter Sending** — Send newsletters to all confirmed subscribers
- **Push Notification Sending** — Broadcast push notifications to all push subscribers
- **Account Management** — Superadmin can create and delete admin accounts

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** (comes with Node.js)
- **MySQL** database server (local or remote)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FMN
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**

   Create `server/.env`:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/fmn_news"
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   SITE_URL=http://localhost:5173
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your@email.com
   SMTP_PASS=your_password
   ```

   Create `.env` in the project root:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
   ```

5. **Set up the database**
   ```bash
   cd server
   npx prisma migrate deploy
   npm run seed
   ```

6. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

7. **Start the frontend dev server** (in a new terminal)
   ```bash
   cd FMN
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

### Default Admin Credentials

> ⚠️ **Important:** Change these credentials immediately after first login.

The seed script creates a default admin account. Check `server/prisma/seed.ts` for the seeded email and password.

### Available Scripts

**Frontend:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

**Backend:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express server with Nodemon (auto-reload) |
| `npm run seed` | Seed the database with initial data |

---

## 📁 Project Structure

```
FMN/
├── src/
│   ├── components/                  # Reusable React components
│   │   ├── Layout.tsx               # Main layout wrapper (header, footer, nav)
│   │   ├── BreakingTicker.tsx       # Live breaking news ticker strip
│   │   ├── MarketPulse.tsx          # Financial data ticker component
│   │   ├── CommentSection.tsx       # Article comments with nesting & upvotes
│   │   ├── VideoPlayer.tsx          # Embedded video player
│   │   ├── StickyShareSidebar.tsx   # Floating social share sidebar
│   │   ├── MostReadSidebar.tsx      # Top articles by view count
│   │   ├── TableOfContents.tsx      # Auto-generated article TOC
│   │   ├── ImageLightbox.tsx        # Click-to-expand image viewer
│   │   ├── TextSelectionPopup.tsx   # Share/annotate on text selection
│   │   ├── ArticleReactions.tsx     # Reader reaction buttons
│   │   ├── LineChart.tsx            # Market line chart
│   │   ├── Slideshow.tsx            # Image/content slideshow
│   │   ├── SuperAdminRoute.tsx      # Route guard for superadmin pages
│   │   └── ...
│   │
│   ├── pages/                       # Page-level components
│   │   ├── Home.tsx                 # Homepage with hero, featured, trending
│   │   ├── ArticleDetail.tsx        # Full article view
│   │   ├── Category.tsx             # Articles filtered by category
│   │   ├── Search.tsx               # Article search results
│   │   ├── Market.tsx               # Financial market data page
│   │   ├── AuthorProfile.tsx        # Author bio and article list
│   │   ├── TagArchive.tsx           # Articles grouped by tag
│   │   ├── Saved.tsx                # User's saved articles
│   │   ├── LiveBlogPage.tsx         # Real-time live blog updates
│   │   ├── Subscribe.tsx            # Newsletter subscription page
│   │   ├── RssFeeds.tsx             # RSS feed info and links
│   │   ├── Login.tsx                # Admin login
│   │   ├── AdminDashboard.tsx       # Admin content management panel
│   │   ├── ArticleEditor.tsx        # Create/edit article form
│   │   └── SuperAdminDashboard.tsx  # User account management (superadmin)
│   │
│   ├── context/
│   │   ├── NewsContext.tsx           # Context provider (articles, authors, market data)
│   │   └── NewsContextCore.tsx       # Core context logic and state
│   │
│   ├── services/
│   │   ├── newsService.ts            # API calls to backend + external market APIs
│   │   └── pushService.ts            # Web push notification registration
│   │
│   ├── types/
│   │   └── news.ts                   # TypeScript interfaces (Article, Author, Comment, etc.)
│   │
│   ├── data/
│   │   ├── siteConfig.json           # Site name, contact info, nav links, socials
│   │   └── initialData.json          # Static seed/fallback data
│   │
│   ├── utils/
│   │   ├── contentRenderer.tsx       # Render article HTML content safely
│   │   ├── readingTime.ts            # Estimate article reading time
│   │   └── timeAgo.ts                # Relative time formatting
│   │
│   ├── App.tsx                       # React Router routes
│   ├── main.tsx                      # App entry point
│   └── index.css                     # Global Tailwind styles
│
├── server/
│   ├── src/
│   │   └── index.ts                  # Express API server (all routes)
│   ├── prisma/
│   │   ├── schema.prisma             # Prisma database schema
│   │   ├── seed.ts                   # Database seeding script
│   │   └── migrations/               # Prisma migration history
│   └── uploads/                      # Uploaded image/file storage
│
├── public/
│   ├── sw.js                         # Service Worker (PWA / push notifications)
│   └── Images/                       # Static image assets
│
├── package.json                      # Frontend dependencies & scripts
├── vite.config.ts                    # Vite build configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── index.html                        # HTML entry template
```

---

## 🗄️ Database Schema

The application uses **MySQL** with **Prisma ORM** and **11 models** covering all content, users, and engagement data.

### Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `admin` | Admin user accounts | id, name, email, password, role |
| `article` | News articles | id, title, content, excerpt, category, status, tags, author, views, isBreaking, isFeatured, scheduledAt |
| `author` | Author profiles | id, name, bio, avatar, role, social links |
| `comment` | Article comments with nesting | id, articleId, parentId, author, content, upvotes |
| `videostory` | Video content | id, title, url, thumbnail, duration |
| `trendingtopic` | Trending hashtags | id, topic, count |
| `breakingnews` | Breaking news ticker items | id, text, link |
| `liveblog` | Live blog containers | id, articleId, title, isActive |
| `liveblogupdate` | Individual live blog updates | id, liveBlogId, content, createdAt |
| `subscriber` | Newsletter subscribers | id, email, confirmed, token |
| `pushsubscription` | Web push subscriptions | id, endpoint, keys |

### Article Status Lifecycle

```
Draft → Scheduled → Published
         ↑ (cron job auto-publishes at scheduledAt)
```

### Supported Article Categories

`World` · `Politics` · `Business` · `Sports` · `Entertainment` · `Science` · `Health`

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library |
| **Vite** | 7.2.4 | Build tool with fast HMR |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **React Router DOM** | 7.13.1 | Client-side routing |
| **Tailwind CSS** | 3.4.19 | Utility-first styling |
| **Radix UI** | Latest | Accessible UI primitives |
| **Framer Motion** | 12.34.3 | Declarative animations |
| **GSAP** | 3.14.2 | Advanced scroll/timeline animations |
| **Lightweight Charts** | 5.1.0 | Financial market charts |
| **Embla Carousel** | 8.6.0 | Touch-friendly carousels |
| **Lucide React** | 0.562.0 | Icon library |
| **date-fns** | 4.1.0 | Date formatting |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express** | 5.2.1 | HTTP API server |
| **Prisma** | 5.22.0 | Database ORM |
| **MySQL** | — | Relational database |
| **jsonwebtoken** | 9.0.3 | JWT authentication |
| **bcryptjs** | 3.0.3 | Password hashing |
| **Multer** | 2.1.1 | File upload handling |
| **Nodemailer** | 8.0.2 | Email sending |
| **web-push** | 3.6.7 | Web push notifications |
| **node-cron** | 4.2.1 | Scheduled article publishing |
| **CORS** | 2.8.6 | Cross-origin request handling |
| **TypeScript** | — | Type-safe server code |

---

## 📡 API Reference

The backend runs on **port 5000**. All endpoints (except login) require a valid JWT token via `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login, returns JWT token |
| `PUT` | `/api/admin/profile/password` | Change logged-in admin's password |

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles` | List articles (paginated, filterable by category/status/tag) |
| `GET` | `/api/articles/search?q=` | Full-text article search |
| `GET` | `/api/articles/most-read` | Top 5 articles by view count |
| `GET` | `/api/articles/:id` | Get single article by ID |
| `POST` | `/api/articles` | Create new article |
| `PUT` | `/api/articles/:id` | Update article |
| `DELETE` | `/api/articles/:id` | Delete article |
| `POST` | `/api/articles/:id/view` | Increment view count |

### Authors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/authors` | List all authors |
| `GET` | `/api/authors/:id` | Get author with their articles |
| `POST` | `/api/authors` | Create author |
| `PUT` | `/api/authors/:id` | Update author |
| `DELETE` | `/api/authors/:id` | Delete author |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/articles/:articleId/comments` | Post a comment (nested via parentId) |
| `POST` | `/api/comments/:id/upvote` | Upvote a comment |
| `DELETE` | `/api/comments/:id` | Delete a comment (admin) |

### Live Blog

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/liveblog/:articleId` | Get live blog for article |
| `POST` | `/api/liveblog` | Create live blog |
| `PATCH` | `/api/liveblog/:id` | Update live blog (title, isActive) |
| `DELETE` | `/api/liveblog/:id` | Delete live blog |
| `POST` | `/api/liveblog/:id/updates` | Add an update to live blog |
| `DELETE` | `/api/liveblog/updates/:id` | Delete a live blog update |

### Videos, Trending & Breaking News

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/videos` | List / create video stories |
| `PUT/DELETE` | `/api/videos/:id` | Update / delete video story |
| `GET/POST` | `/api/trending` | List / create trending topics |
| `DELETE` | `/api/trending/:id` | Delete trending topic |
| `GET/POST` | `/api/breaking-news` | List / create breaking news items |
| `DELETE` | `/api/breaking-news/:id` | Delete breaking news item |

### Newsletter & Push Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/subscribe` | Subscribe to newsletter |
| `GET` | `/api/subscribe/confirm/:token` | Confirm email subscription |
| `POST` | `/api/newsletter/send` | Send newsletter to all subscribers (admin) |
| `POST` | `/api/push/subscribe` | Register browser for push notifications |
| `POST` | `/api/push/send` | Broadcast push notification (admin) |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload image or file (max 10 MB) |

### RSS Feeds

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/feed.xml` | Main RSS feed (20 latest articles) |
| `GET` | `/feed/:category.xml` | Category-specific RSS feed |

### Admin Accounts (Superadmin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/accounts` | List all admin accounts |
| `POST` | `/api/admin/accounts` | Create new admin account |
| `DELETE` | `/api/admin/accounts/:id` | Delete admin account |

---

## ⚙️ Environment Variables

### Frontend (`/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_VAPID_PUBLIC_KEY` | — | VAPID public key for web push |

### Backend (`/server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `PORT` | No (5000) | Server port |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `SITE_URL` | No | Site URL for email links |
| `VAPID_PUBLIC_KEY` | For push | VAPID public key |
| `VAPID_PRIVATE_KEY` | For push | VAPID private key |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_PORT` | For email | SMTP server port |
| `SMTP_USER` | For email | SMTP username/email |
| `SMTP_PASS` | For email | SMTP password |

> 💡 Generate VAPID keys with: `npx web-push generate-vapid-keys`

---

## 👥 Admin Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access to articles, authors, videos, trending, breaking news, newsletter, and push notifications |
| **Superadmin** | Everything Admin can do, plus manage all admin user accounts (create/delete) |

---

## 📈 Market Data

The Market page aggregates data from free external APIs:

| Data Type | Source |
|-----------|--------|
| **Forex Rates** | `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api` |
| **Cryptocurrency** | Coinpaprika API |
| **Market Indices / Commodities / Bonds** | Via `newsService.ts` |

All market data is fetched client-side from the `newsService`. No API keys are required for these integrations.

---

## 🔔 Push Notifications & RSS

### Web Push Setup

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add keys to `server/.env` and `.env`
3. The service worker at `public/sw.js` handles push events in the browser

### RSS Feeds

- **Main feed:** `/feed.xml` — 20 latest published articles
- **Category feeds:** `/feed/world.xml`, `/feed/politics.xml`, etc.

RSS feeds are generated dynamically by the backend and compatible with all standard RSS readers.

---

## 🔐 Security

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcryptjs with salt rounds (10) |
| **JWT Authentication** | Token-based auth stored in localStorage |
| **Protected API Routes** | All admin routes require valid JWT |
| **Role-Based Access** | Admin vs. Superadmin route guards |
| **CORS** | Configured to allow only frontend origin |
| **File Upload Limits** | 10 MB max via Multer |
| **Double Opt-In Newsletter** | Email confirmation token required |
| **SQL Injection Prevention** | All queries via Prisma ORM (parameterized) |

### Authentication Flow

1. Admin submits email + password to `POST /api/auth/login`
2. Password verified via bcrypt comparison
3. JWT token generated with user id, email, and role
4. Token returned to client, stored in `localStorage`
5. All admin API requests include `Authorization: Bearer <token>` header
6. Backend verifies token on every protected route

---

## 🧩 PWA Support

The site includes a service worker (`public/sw.js`) enabling:

- **Push Notification** reception in the background
- **Installability** as a Progressive Web App on supported devices/browsers

---

## 🔧 Troubleshooting

### Common Issues

**MySQL connection error**
```bash
# Verify DATABASE_URL in server/.env is correct
# Ensure MySQL server is running and the database exists
npx prisma migrate deploy
```

**Port already in use**
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000
# Kill process on port 5173 (frontend)
npx kill-port 5173
```

**Missing modules after git pull**
```bash
npm install
cd server && npm install
```

**Prisma client out of sync**
```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

**Push notifications not working**
- Ensure VAPID keys match between `.env` and `server/.env`
- HTTPS is required for push notifications in production

### Reset Database

> ⚠️ This will delete all data.

```bash
cd server
npx prisma migrate reset
npm run seed
```

---

## 🤝 Contributing

This is a private project. For any inquiries, please contact the project maintainer.

---

## 📬 Contact

**Name:** Arslan Nafees

**Phone:** +92 334 111 3047

**Email:** arslannafees807@gmail.com

[![GitHub](https://img.shields.io/badge/GitHub-arslannafees-181717?style=flat&logo=github)](https://github.com/arslannafees)

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

```
Copyright (c) 2026 Arslan Nafees
All rights reserved.
```

---

<p align="center">
  Built for FMN News · Islamabad, Pakistan<br/>
  <sub>Powered by React, Express, Prisma, and MySQL</sub>
</p>
