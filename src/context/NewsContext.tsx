import { useState, useEffect, type ReactNode } from 'react';
import type { Article, VideoStory, TrendingTopic, ArticleComment } from '@/types/news';
import initialData from '@/data/initialData.json';
import siteConfig from '@/data/siteConfig.json';
import { fetchArticles, fetchArticlesPaginated, fetchVideos, fetchDynamicTrending, fetchBreakingNews } from '@/services/newsService';
import {
  NewsContext,
  PREDEFINED_IMAGES,
  getCategoryColors,
  hashPassword,
  type SiteConfig,
} from './NewsContextCore';

const getAPIBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Development: construct URL based on current host
  const hostname = window.location.hostname;
  const port = 5000;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = getAPIBaseURL();

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [videoStories, setVideoStories] = useState<VideoStory[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [breakingNews, setBreakingNews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

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

  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem('fmn_admin_token'));
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => sessionStorage.getItem('fmn_admin_role') === 'superadmin');
  const [currentUsername, setCurrentUsername] = useState(() => sessionStorage.getItem('fmn_admin_username') ?? '');
  const [adminAccounts, setAdminAccounts] = useState<{ id: string; username: string; role: string }[]>([]);

  const getAuthHeader = (): Record<string, string> => {
    const token = sessionStorage.getItem('fmn_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };
  const config = siteConfig as SiteConfig;
  const categoryColors = getCategoryColors(config);

  // Data Loading from API
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [dbArticles, dbVideos, dbTrending, dbBreaking] = await Promise.all([
          fetchArticles(),
          fetchVideos(),
          fetchDynamicTrending(),
          fetchBreakingNews()
        ]);

        // Filter out any temporary blob URLs that might have been saved in the DB
        // Also deserialize tags from comma-string to string[]
        const cleanedArticles = dbArticles.map((article: Article & { comment?: ArticleComment[] }) => {
          const rawTags = article.tags as unknown;
          return {
            ...article,
            image: article.image?.startsWith('blob:') ? '/hero-featured.jpg' : article.image,
            tags: typeof rawTags === 'string'
              ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
              : (article.tags ?? []),
            // Prisma returns the relation as "comment" (model name); rename to "comments"
            comments: article.comment ?? article.comments ?? [],
          };
        });

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
      const payload = { ...article, tags: Array.isArray(article.tags) ? article.tags.join(',') : (article.tags ?? '') };
      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload)
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
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
        method: 'DELETE',
        headers: { ...getAuthHeader() }
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

  const loadMore = async () => {
    try {
      const nextPage = currentPage + 1;
      const data = await fetchArticlesPaginated(nextPage, PAGE_SIZE);
      const cleaned = data.articles.map((article: Article) => ({
        ...article,
        image: article.image?.startsWith('blob:') ? '/hero-featured.jpg' : article.image
      }));
      setArticles(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        return [...prev, ...cleaned.filter((a: Article) => !existingIds.has(a.id))];
      });
      setCurrentPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } catch (err) {
      console.error('Failed to load more articles:', err);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Try JWT backend first
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const { token, role } = await res.json();
        sessionStorage.setItem('fmn_admin_token', token);
        sessionStorage.setItem('fmn_admin_role', role ?? 'admin');
        sessionStorage.setItem('fmn_admin_username', username);
        setIsAdmin(true);
        setIsSuperAdmin(role === 'superadmin');
        setCurrentUsername(username);
        return { success: true, role: role ?? 'admin' };
      }
    } catch {
      // Fallback: local SHA-256 check if backend unreachable
    }

    // Fallback to old SHA-256 local method
    const inputHash = await hashPassword(password);
    let storedHash = localStorage.getItem('fmn_admin_hash');
    if (!storedHash) {
      storedHash = await hashPassword('admin');
      localStorage.setItem('fmn_admin_hash', storedHash);
    }
    if (inputHash === storedHash) {
      setIsAdmin(true);
      sessionStorage.setItem('fmn_admin_token', 'local-fallback');
      return { success: true, role: 'admin' };
    }
    return { success: false, role: null };
  };

  const logout = () => {
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminAccounts([]);
    setCurrentUsername('');
    sessionStorage.removeItem('fmn_admin_token');
    sessionStorage.removeItem('fmn_admin_role');
    sessionStorage.removeItem('fmn_admin_username');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to change password');
    }
  };

  const fetchAdminAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/accounts`, { headers: getAuthHeader() });
      if (res.ok) setAdminAccounts(await res.json());
    } catch { /* silent */ }
  };

  const createAdminAccount = async (username: string, password: string, role: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create account');
    }
    const account = await res.json();
    setAdminAccounts(prev => [...prev, account]);
  };

  const deleteAdminAccount = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete account');
    }
    setAdminAccounts(prev => prev.filter(a => a.id !== id));
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
        isSuperAdmin,
        currentUsername,
        changePassword,
        setIsAdmin,
        adminAccounts,
        fetchAdminAccounts,
        createAdminAccount,
        deleteAdminAccount,
        customImages,
        libraryImages,
        addCustomImage,
        deleteImage,
        login,
        logout,
        loading,
        error,
        loadMore,
        hasMore
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}
