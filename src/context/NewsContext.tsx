import { useState, useEffect, type ReactNode } from 'react';
import type { Article, VideoStory, TrendingTopic, ArticleComment } from '@/types/news';
import initialData from '@/data/initialData.json';
import siteConfig from '@/data/siteConfig.json';
import { fetchArticles, fetchVideos, fetchDynamicTrending, fetchBreakingNews } from '@/services/newsService';
import {
  NewsContext,
  PREDEFINED_IMAGES,
  getCategoryColors,
  hashPassword,
  type SiteConfig,
} from './NewsContextCore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [videoStories, setVideoStories] = useState<VideoStory[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [breakingNews, setBreakingNews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customImages, setCustomImages] = useState<string[]>(() => {
    const saved = localStorage.getItem('fmn_custom_images');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((img: string) => !img.startsWith('blob:')) : [];
    } catch {
      return [];
    }
  });

  const [libraryImages, setLibraryImages] = useState<string[]>(() => {
    const saved = localStorage.getItem('fmn_library_images');
    if (!saved) return PREDEFINED_IMAGES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((img: string) => !img.startsWith('blob:')) : PREDEFINED_IMAGES;
    } catch {
      return PREDEFINED_IMAGES;
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('fmn_admin_auth') === 'true';
  });
  const config = siteConfig as SiteConfig;
  const categoryColors = getCategoryColors(config);

  // Data Loading from API
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        console.log('Fetching data from MySQL API...');
        const [dbArticles, dbVideos, dbTrending, dbBreaking] = await Promise.all([
          fetchArticles(),
          fetchVideos(),
          fetchDynamicTrending(),
          fetchBreakingNews()
        ]);

        // Filter out any temporary blob URLs that might have been saved in the DB
        const cleanedArticles = dbArticles.map((article: Article) => ({
          ...article,
          image: article.image?.startsWith('blob:') ? '/hero-featured.jpg' : article.image
        }));

        const cleanedVideos = dbVideos.map((video: VideoStory) => ({
          ...video,
          image: video.image?.startsWith('blob:') ? '/video-climate.jpg' : video.image,
          url: video.url?.startsWith('blob:') ? '' : video.url
        }));

        setArticles(cleanedArticles);
        setVideoStories(cleanedVideos);
        setTrendingTopics(dbTrending);
        setBreakingNews(dbBreaking);
        setError(null);
      } catch (err) {
        console.error('Failed to load data from API:', err);
        setError('Connection to backend failed. Check if server is running.');

        // Fallback to initial data ONLY if DB is empty/unreachable for first-time setup
        // But the user specifically asked all data to come from SQL database,
        // so we'll show an error but still keep initialData for a better UX if the DB is actually just empty.
        setArticles(prevArticles => {
          if (prevArticles.length === 0) {
            setVideoStories(initialData.videoStories as VideoStory[]);
            setTrendingTopics(initialData.trendingTopics as TrendingTopic[]);
            setBreakingNews(initialData.breakingNews as string[]);
            return initialData.articles as Article[];
          }
          return prevArticles;
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []); // Only run once on mount



  // Remove restoration logic for blobs since we are not using them anymore

  // Remove localStorage persistence for DB-managed data
  // Keep it for images and admin auth
  useEffect(() => {
    localStorage.setItem('fmn_custom_images', JSON.stringify(customImages));
  }, [customImages]);

  useEffect(() => {
    localStorage.setItem('fmn_library_images', JSON.stringify(libraryImages));
  }, [libraryImages]);

  const addArticle = async (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      if (response.ok) {
        const newArticle = await response.json();
        setArticles(prev => [newArticle, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add article:', err);
      alert('Failed to save article. The payload might be too large or the server is down.');
    }
  };

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const updatedArticle = await response.json();
        setArticles(prev =>
          prev.map(article =>
            article.id === id ? updatedArticle : article
          )
        );
      }
    } catch (err) {
      console.error('Failed to update article:', err);
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setArticles(prev => prev.filter(article => article.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  const getArticleById = (id: string) => {
    return articles.find(article => article.id === id);
  };

  const getFeaturedArticles = () => {
    return articles.filter(article => article.featured);
  };

  const getFeaturedArticle = () => {
    return articles.find(article => article.featured) || articles[0];
  };

  const getSideStories = () => {
    return articles.filter(article => !article.featured).slice(0, 3);
  };

  const getEditorsPicks = () => {
    return articles.slice(0, 6);
  };

  const getLatestNews = () => {
    return articles.slice(0, 7);
  };

  const getArticlesByCategory = (category: string) => {
    return articles.filter(article => article.category === category);
  };

  const addVideoStory = async (video: Omit<VideoStory, 'id'>) => {
    try {
      // For simplicity, we'll send the metadata first. 
      // Real file uploads would need FormData, but let's stick to the current API structure.
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video)
      });
      if (response.ok) {
        const newVideo = await response.json();
        setVideoStories(prev => [...prev, newVideo]);
      }
    } catch (err) {
      console.error('Failed to add video story:', err);
      alert('Failed to save video. Please check your connection and try again.');
    }
  };

  const updateVideoStory = async (id: string, updates: Partial<VideoStory>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const updatedVideo = await response.json();
        setVideoStories(prev =>
          prev.map(video => (video.id === id ? updatedVideo : video))
        );
      }
    } catch (err) {
      console.error('Failed to update video story:', err);
    }
  };

  const deleteVideoStory = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setVideoStories(prev => prev.filter(video => video.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete video story:', err);
    }
  };

  const addTrendingTopic = async (topic: Omit<TrendingTopic, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topic)
      });
      if (response.ok) {
        const newTopic = await response.json();
        setTrendingTopics(prev => [...prev, newTopic]);
      }
    } catch (err) {
      console.error('Failed to add trending topic:', err);
    }
  };

  const deleteTrendingTopic = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTrendingTopics(prev => prev.filter(topic => topic.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete trending topic:', err);
    }
  };

  const addBreakingNews = async (news: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/breaking-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: news })
      });
      if (response.ok) {
        // Fetch all again to ensure correct order/state
        const updatedBreaking = await fetchBreakingNews();
        setBreakingNews(updatedBreaking);
      }
    } catch (err) {
      console.error('Failed to add breaking news:', err);
    }
  };

  const addComment = async (articleId: string, comment: Omit<ArticleComment, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment)
      });
      if (response.ok) {
        const newComment = await response.json();
        setArticles(prev => prev.map(article => {
          if (article.id === articleId) {
            return {
              ...article,
              comments: [...(article.comments || []), newComment]
            };
          }
          return article;
        }));
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const deleteComment = async (articleId: string, commentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setArticles(prev => prev.map(article => {
          if (article.id === articleId) {
            return {
              ...article,
              comments: (article.comments || []).filter((c: ArticleComment) => c.id !== commentId)
            };
          }
          return article;
        }));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const deleteBreakingNews = (index: number) => {
    setBreakingNews(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomImage = (image: string) => {
    setCustomImages(prev => [image, ...prev]);
  };

  const deleteImage = (image: string) => {
    setCustomImages(prev => prev.filter(img => img !== image));
    setLibraryImages(prev => prev.filter(img => img !== image));
  };

  const login = async (password: string) => {
    const inputHash = await hashPassword(password);

    // Initialize default password hash if it doesn't exist
    let storedHash = localStorage.getItem('fmn_admin_hash');
    if (!storedHash) {
      storedHash = await hashPassword('admin');
      localStorage.setItem('fmn_admin_hash', storedHash);
    }

    if (inputHash === storedHash) {
      setIsAdmin(true);
      sessionStorage.setItem('fmn_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('fmn_admin_auth');
  };

  return (
    <NewsContext.Provider
      value={{
        articles,
        videoStories,
        trendingTopics,
        breakingNews,
        config,
        categoryColors,
        addArticle,
        updateArticle,
        deleteArticle,
        getArticleById,
        getFeaturedArticles,
        getFeaturedArticle,
        getSideStories,
        getEditorsPicks,
        getLatestNews,
        getArticlesByCategory,
        addVideoStory,
        updateVideoStory,
        deleteVideoStory,
        addTrendingTopic,
        deleteTrendingTopic,
        addBreakingNews,
        deleteBreakingNews,
        addComment,
        deleteComment,
        isAdmin,
        setIsAdmin,
        customImages,
        libraryImages,
        addCustomImage,
        deleteImage,
        login,
        logout,
        loading,
        error
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}
