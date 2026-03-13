import { createContext, useContext } from 'react';
import type { Article, VideoStory, TrendingTopic, ArticleComment } from '@/types/news';

export interface SiteConfig {
    site: {
        name: string;
        tagline: string;
        description: string;
        location: string;
        email: string;
        phone: string;
        copyright: string;
    };
    navigation: Array<{ name: string; path: string }>;
    socialLinks: Array<{ platform: string; url: string; icon: string }>;
    categories: Array<{ name: string; color: string }>;
    footerLinks: {
        company: Array<{ name: string; url: string }>;
    };
}

export interface NewsContextType {
    articles: Article[];
    videoStories: VideoStory[];
    trendingTopics: TrendingTopic[];
    breakingNews: string[];
    config: SiteConfig;
    categoryColors: Record<string, string>;
    addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateArticle: (id: string, article: Partial<Article>) => void;
    deleteArticle: (id: string) => void;
    getArticleById: (id: string) => Article | undefined;
    getFeaturedArticles: () => Article[];
    getFeaturedArticle: () => Article | undefined;
    getSideStories: () => Article[];
    getEditorsPicks: () => Article[];
    getLatestNews: () => Article[];
    getArticlesByCategory: (category: string) => Article[];
    addVideoStory: (video: Omit<VideoStory, 'id'>) => Promise<void>;
    updateVideoStory: (id: string, video: Partial<VideoStory>) => void;
    deleteVideoStory: (id: string) => void;
    addTrendingTopic: (topic: Omit<TrendingTopic, 'id'>) => void;
    deleteTrendingTopic: (id: string) => void;
    addBreakingNews: (news: string) => void;
    deleteBreakingNews: (index: number) => void;
    addComment: (articleId: string, comment: Omit<ArticleComment, 'id' | 'createdAt'>) => void;
    deleteComment: (articleId: string, commentId: string) => void;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    setIsAdmin: (value: boolean) => void;
    adminAccounts: { id: string; username: string; role: string }[];
    fetchAdminAccounts: () => Promise<void>;
    createAdminAccount: (username: string, password: string, role: string) => Promise<void>;
    deleteAdminAccount: (id: string) => Promise<void>;
    customImages: string[];
    libraryImages: string[];
    addCustomImage: (image: string) => void;
    deleteImage: (image: string) => void;
    currentUsername: string;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    login: (username: string, password: string) => Promise<{ success: boolean; role: string | null }>;
    logout: () => void;
    loading: boolean;
    error: string | null;
    loadMore: () => Promise<void>;
    hasMore: boolean;
}

export const PREDEFINED_IMAGES = [
    '/hero-featured.jpg',
    '/side-story-sports.jpg',
    '/side-story-business.jpg',
    '/editors-mars.jpg',
    '/editors-medical.jpg',
    '/editors-archaeology.jpg',
    '/editors-ev.jpg',
    '/editors-manuscript.jpg',
    '/editors-ocean.jpg',
    '/latest-un.jpg',
    '/latest-politics.jpg',
    '/latest-wildlife.jpg',
    '/latest-entertainment.jpg',
    '/latest-quantum.jpg',
    '/video-climate.jpg',
];

export const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function useNews() {
    const context = useContext(NewsContext);
    if (context === undefined) {
        throw new Error('useNews must be used within a NewsProvider');
    }
    return context;
}

// Helper to derive category colors from config
export const getCategoryColors = (config: SiteConfig) => {
    const colors: Record<string, string> = {};
    config.categories.forEach(cat => {
        colors[cat.name] = cat.color;
    });
    return colors;
};

// Helper to hash password using SHA-256
export const hashPassword = async (password: string) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
