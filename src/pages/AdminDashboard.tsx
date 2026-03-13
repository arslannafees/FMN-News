import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, ArrowLeft,
  Eye, TrendingUp, Video, Newspaper, LogOut, Zap,
  LayoutDashboard, MessageSquare, Image, Upload,
  Star, BarChart2, Check, X, ChevronUp, ChevronDown,
  CheckCircle2, AlertCircle, ArrowUpDown,
  ChevronLeft, ChevronRight, Download, Copy, Clock,
  Activity, ToggleLeft, ToggleRight, Users, ShieldCheck,
  UserCircle, KeyRound, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';
import type { ArticleComment } from '@/types/news';

type TabType = 'overview' | 'articles' | 'comments' | 'videos' | 'trending' | 'breaking' | 'images' | 'accounts';
type SortField = 'title' | 'date' | 'views' | 'category' | 'status';
type SortDir = 'asc' | 'desc';

// ─── Toast System ──────────────────────────────────────────────────────────────
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto
            backdrop-blur-sm border animate-in slide-in-from-right-4 fade-in duration-200
            ${t.type === 'success' ? 'bg-zinc-900/95 border-zinc-700 text-white' :
              t.type === 'error' ? 'bg-red-900/95 border-red-700 text-white' :
              'bg-blue-900/95 border-blue-700 text-white'}`}
        >
          {t.type === 'success' && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
          {t.type === 'error' && <AlertCircle size={15} className="text-red-400 shrink-0" />}
          {t.type === 'info' && <AlertCircle size={15} className="text-blue-400 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Count-up Animation ────────────────────────────────────────────────────────
function useCountUp(target: number) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) { setCount(target); return; }
    const duration = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return count;
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'rgba(255,255,255,0.7)' }: { data: number[]; color?: string }) {
  if (!data.length || data.every(v => v === 0)) return null;
  const w = 80, h = 28;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) =>
    `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * h * 0.85 + 2}`
  ).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Gradient Stat Card ────────────────────────────────────────────────────────
function GradientStatCard({
  icon: Icon, label, value, sub, gradient, sparkData, trend,
}: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; gradient: string; sparkData?: number[]; trend?: number;
}) {
  const numVal = typeof value === 'number' ? value : 0;
  const animated = useCountUp(numVal);
  const display = typeof value === 'number'
    ? (numVal >= 1000 ? `${(animated / 1000).toFixed(1)}K` : animated)
    : value;
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg relative overflow-hidden" style={{ background: gradient }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon size={17} className="text-white" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {sparkData && <Sparkline data={sparkData} color="rgba(255,255,255,0.6)" />}
            {trend !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${trend >= 0 ? 'bg-white/25 text-white' : 'bg-black/25 text-white/80'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
              </span>
            )}
          </div>
        </div>
        <div className="font-display font-bold text-3xl tracking-tight">{display}</div>
        <div className="text-sm text-white/80 mt-0.5 font-medium">{label}</div>
        {sub && <div className="text-[11px] text-white/60 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Small Stat Card ───────────────────────────────────────────────────────────
function SmallStatCard({ icon: Icon, label, value, color = '#e53935' }: {
  icon: React.ElementType; label: string; value: number | string; color?: string;
}) {
  const numVal = typeof value === 'number' ? value : 0;
  const animated = useCountUp(numVal);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="font-display font-bold text-xl text-[#1a1a1a] dark:text-zinc-100">
          {typeof value === 'number' ? animated : value}
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ id, confirmKey, onRequest, onConfirm, onCancel }: {
  id: string | number; confirmKey: string | number | null;
  onRequest: () => void; onConfirm: () => void; onCancel: () => void;
}) {
  if (confirmKey === id) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onConfirm}
          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" title="Confirm">
          <Check size={13} />
        </button>
        <button onClick={onCancel}
          className="p-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg hover:bg-gray-300 transition-colors" title="Cancel">
          <X size={13} />
        </button>
      </div>
    );
  }
  return (
    <button onClick={onRequest}
      className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 rounded-lg transition-colors" title="Delete">
      <Trash2 size={14} />
    </button>
  );
}

// ─── Sort Header Button ────────────────────────────────────────────────────────
function SortTh({ field, label, current, dir, onClick, className = '' }: {
  field: SortField; label: string; current: SortField; dir: SortDir;
  onClick: (f: SortField) => void; className?: string;
}) {
  const active = current === field;
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none
        transition-colors hover:text-[#e53935] ${active ? 'text-[#e53935]' : 'text-gray-500 dark:text-zinc-400'} ${className}`}
      onClick={() => onClick(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={11} className="opacity-40" />}
      </span>
    </th>
  );
}

// ─── Keyboard Shortcut Badge ───────────────────────────────────────────────────
function KbdBadge({ children }: { children: string }) {
  return (
    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium
      bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-300 dark:border-zinc-600
      rounded ml-1.5">
      {children}
    </kbd>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const {
    articles, videoStories, trendingTopics, breakingNews,
    deleteArticle, updateArticle, deleteVideoStory, deleteTrendingTopic, deleteBreakingNews,
    addBreakingNews, addTrendingTopic, addVideoStory,
    categoryColors, config, logout,
    customImages, libraryImages, addCustomImage, deleteImage,
    deleteComment,
    isSuperAdmin, adminAccounts, fetchAdminAccounts, createAdminAccount, deleteAdminAccount,
    currentUsername, changePassword,
  } = useNews();

  const { toasts, add: toast, remove: removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filters & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Comments search
  const [commentSearch, setCommentSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm delete
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);

  // Breaking / trending forms
  const [newBreakingNews, setNewBreakingNews] = useState('');
  const [trendingForm, setTrendingForm] = useState({ tag: '', count: '' });

  // Video slide-over
  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', duration: '', image: '', url: '' });

  // Image drag & drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Accounts (superadmin)
  const [newAccount, setNewAccount] = useState({ username: '', password: '', role: 'admin' });
  const [accountError, setAccountError] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  // Profile / change password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'accounts') fetchAdminAccounts();
  }, [isSuperAdmin, activeTab]);

  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-logout on tab close
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [logout]);

  // Reset on tab switch
  useEffect(() => {
    setConfirmId(null);
    setConfirmCommentId(null);
    setSelectedIds(new Set());
  }, [activeTab]);

  // Reset page on filter/sort change
  useEffect(() => setPage(1), [searchQuery, filterCategory, filterStatus, sortBy]);

  // Keyboard shortcuts
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/' && activeTab === 'articles') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setConfirmId(null);
        setIsVideoDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalViews = useMemo(() => articles.reduce((s, a) => s + (a.views || 0), 0), [articles]);
  const totalComments = useMemo(() => articles.reduce((s, a) => s + (a.comments?.length || 0), 0), [articles]);
  const featuredCount = useMemo(() => articles.filter(a => a.featured).length, [articles]);

  // Week-over-week trend comparison
  const trends = useMemo(() => {
    const now = Date.now();
    const week = 7 * 86400000;
    const thisW = articles.filter(a => now - new Date(a.createdAt).getTime() < week).length;
    const lastW = articles.filter(a => {
      const age = now - new Date(a.createdAt).getTime();
      return age >= week && age < 2 * week;
    }).length;
    const articleTrend = lastW === 0 ? (thisW > 0 ? 100 : 0) : Math.round(((thisW - lastW) / lastW) * 100);

    const thisWC = articles.reduce((s, a) =>
      s + (a.comments || []).filter(c => now - new Date(c.createdAt).getTime() < week).length, 0);
    const lastWC = articles.reduce((s, a) =>
      s + (a.comments || []).filter(c => {
        const age = now - new Date(c.createdAt).getTime();
        return age >= week && age < 2 * week;
      }).length, 0);
    const commentTrend = lastWC === 0 ? (thisWC > 0 ? 100 : 0) : Math.round(((thisWC - lastWC) / lastWC) * 100);

    const todayArticles = articles.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length;
    return { articleTrend, commentTrend, todayArticles };
  }, [articles]);

  // 7-day trend data
  const weeklyTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return articles.filter(a => new Date(a.createdAt).toDateString() === d.toDateString()).length;
    });
  }, [articles]);

  const weeklyComments = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      return articles.reduce((s, a) =>
        s + (a.comments || []).filter(c => new Date(c.createdAt).toDateString() === dateStr).length, 0);
    });
  }, [articles]);

  const allComments = useMemo(() => {
    const list: Array<{ comment: ArticleComment; articleId: string; articleTitle: string }> = [];
    articles.forEach(article => {
      (article.comments || []).forEach(comment => {
        list.push({ comment, articleId: article.id, articleTitle: article.title });
      });
    });
    return list.sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());
  }, [articles]);

  const filteredComments = useMemo(() => {
    if (!commentSearch) return allComments;
    const q = commentSearch.toLowerCase();
    return allComments.filter(({ comment, articleTitle }) =>
      comment.content.toLowerCase().includes(q) ||
      (comment.author || '').toLowerCase().includes(q) ||
      articleTitle.toLowerCase().includes(q)
    );
  }, [allComments, commentSearch]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    articles.forEach(a => { stats[a.category] = (stats[a.category] || 0) + 1; });
    return Object.entries(stats)
      .map(([cat, count]) => ({
        cat, count,
        pct: articles.length ? Math.round((count / articles.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  const recentArticles = useMemo(() =>
    [...articles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [articles]);

  // Activity feed: mix of recent articles + comments sorted by date
  const activityFeed = useMemo(() => {
    type FeedItem = { type: 'article' | 'comment'; title: string; sub: string; date: string; id: string };
    const items: FeedItem[] = [];
    recentArticles.forEach(a => items.push({
      type: 'article',
      title: `"${a.title.length > 48 ? a.title.slice(0, 48) + '…' : a.title}"`,
      sub: `Published by ${a.author} · ${a.category}`,
      date: a.createdAt,
      id: a.id,
    }));
    allComments.slice(0, 8).forEach(({ comment, articleTitle }) => items.push({
      type: 'comment',
      title: `${comment.author || 'Anonymous'} commented`,
      sub: comment.content.length > 60 ? comment.content.slice(0, 60) + '…' : comment.content,
      date: comment.createdAt,
      id: comment.id,
    }));
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [recentArticles, allComments]);

  const allImages = useMemo(() => {
    const seen = new Set<string>();
    return [...libraryImages, ...customImages].filter(img => {
      if (seen.has(img)) return false;
      seen.add(img);
      return true;
    });
  }, [libraryImages, customImages]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return articles.filter(a => {
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.author.toLowerCase().includes(q);
      const matchCat = !filterCategory || a.category === filterCategory;
      const matchStatus = !filterStatus || (a.status || 'published') === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [articles, searchQuery, filterCategory, filterStatus]);

  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0;
      if (sortBy === 'title') { av = a.title; bv = b.title; }
      else if (sortBy === 'date') { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); }
      else if (sortBy === 'views') { av = a.views || 0; bv = b.views || 0; }
      else if (sortBy === 'category') { av = a.category; bv = b.category; }
      else if (sortBy === 'status') { av = a.status || 'published'; bv = b.status || 'published'; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredArticles, sortBy, sortDir]);

  const paginatedArticles = useMemo(() =>
    sortedArticles.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [sortedArticles, page]);

  const totalPages = Math.ceil(sortedArticles.length / PER_PAGE);

  const now24h = Date.now() - 86400000;
  const isNew = (dateStr: string) => new Date(dateStr).getTime() > now24h;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedArticles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedArticles.map(a => a.id)));
  };

  const bulkDelete = () => {
    const count = selectedIds.size;
    selectedIds.forEach(id => deleteArticle(id));
    setSelectedIds(new Set());
    toast(`Deleted ${count} article${count > 1 ? 's' : ''}`, 'success');
  };

  const handleToggleStatus = (articleId: string, currentStatus: string) => {
    const newStatus = (currentStatus || 'published') === 'published' ? 'draft' : 'published';
    updateArticle(articleId, { status: newStatus });
    toast(`Article ${newStatus === 'published' ? 'published' : 'moved to drafts'}`);
  };

  const exportCSV = () => {
    const headers = ['Title', 'Category', 'Author', 'Status', 'Views', 'Date'];
    const rows = sortedArticles.map(a => [
      `"${a.title.replace(/"/g, '""')}"`,
      a.category,
      `"${a.author}"`,
      a.status || 'published',
      a.views || 0,
      new Date(a.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'articles.csv'; el.click();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully');
  };

  const copyImageUrl = async (img: string) => {
    const text = img.startsWith('data:') ? img.slice(0, 40) + '…' : img;
    try {
      await navigator.clipboard.writeText(img);
      toast('Copied to clipboard');
    } catch {
      toast('Copy failed — try manually', 'error');
    }
    void text;
  };

  const getVideoDuration = (fileOrUrl: string | File): Promise<string> => {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(video.src);
        const m = Math.floor(video.duration / 60);
        const s = Math.floor(video.duration % 60);
        resolve(`${m}:${s.toString().padStart(2, '0')}`);
      };
      video.onerror = () => resolve('0:00');
      video.src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'url') {
      // Get duration before upload using a temporary object URL (no base64 needed)
      const duration = await getVideoDuration(file);
      setVideoForm(prev => ({ ...prev, duration }));

      // Upload video file to server instead of base64-encoding it
      const formData = new FormData();
      formData.append('file', file);
      try {
        const apiBase = import.meta.env.VITE_API_URL ||
          `${window.location.protocol}//${window.location.hostname}:5000/api`;
        const res = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData });
        if (res.ok) {
          const { url } = await res.json();
          setVideoForm(prev => ({ ...prev, url }));
        }
      } catch {
        toast('Upload failed — check server connection', 'error');
      }
      return;
    }

    // For thumbnail images, base64 is fine (small size)
    const reader = new FileReader();
    reader.onloadend = () => setVideoForm(prev => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVideoStory(videoForm);
    setVideoForm({ title: '', duration: '', image: '', url: '' });
    setIsVideoDrawerOpen(false);
    toast('Video story added successfully');
  };

  const handleAddBreakingNews = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newBreakingNews.trim()) {
      addBreakingNews(newBreakingNews.trim());
      setNewBreakingNews('');
      toast('Breaking headline added');
    }
  };

  const handleAddTrendingTopic = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (trendingForm.tag.trim()) {
      addTrendingTopic({
        tag: trendingForm.tag.startsWith('#') ? trendingForm.tag : `#${trendingForm.tag}`,
        count: trendingForm.count || '0',
        size: 'medium',
      });
      setTrendingForm({ tag: '', count: '' });
      toast('Trending topic added');
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      addCustomImage(reader.result as string);
      toast('Image uploaded to library');
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  };

  // ── Nav items ────────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'articles' as TabType, label: 'Articles', icon: Newspaper, count: articles.length },
    { id: 'comments' as TabType, label: 'Comments', icon: MessageSquare, count: totalComments },
    { id: 'videos' as TabType, label: 'Videos', icon: Video, count: videoStories.length },
    { id: 'trending' as TabType, label: 'Trending', icon: TrendingUp, count: trendingTopics.length },
    { id: 'breaking' as TabType, label: 'Breaking', icon: Zap, count: breakingNews.length },
    { id: 'images' as TabType, label: 'Images', icon: Image, count: allImages.length },
    ...(isSuperAdmin ? [{ id: 'accounts' as TabType, label: 'Accounts', icon: Users, count: adminAccounts.length }] : []),
  ];

  const categoryColorList = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

  return (
    <div className="py-6 lg:py-8">
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* ── Video Slide-over Backdrop ── */}
      {isVideoDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsVideoDrawerOpen(false)}
        />
      )}

      {/* ── Video Slide-over Drawer ── */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-zinc-900 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isVideoDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b dark:border-zinc-800 shrink-0">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1a1a1a] dark:text-zinc-100">Add Video Story</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Upload or link a video</p>
            </div>
            <button
              onClick={() => setIsVideoDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-400"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleVideoSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Title <span className="text-[#e53935]">*</span>
              </label>
              <Input
                required
                value={videoForm.title}
                onChange={e => setVideoForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Video title..."
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                Thumbnail <span className="text-[#e53935]">*</span>
              </label>
              {videoForm.image.startsWith('data:') ? (
                <div className="relative rounded-xl overflow-hidden h-32 mb-2">
                  <img src={videoForm.image} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setVideoForm(p => ({ ...p, image: '' }))}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  required={!videoForm.image.startsWith('data:')}
                  value={videoForm.image.startsWith('data:') ? '' : videoForm.image}
                  onChange={e => setVideoForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="https://... or upload"
                  className="text-sm flex-1"
                />
                <label className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-800
                  hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors text-gray-500">
                  <Upload size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Video Source</label>
              <div className="flex gap-2">
                <Input
                  value={videoForm.url.startsWith('data:') ? '(file uploaded)' : videoForm.url}
                  onChange={async e => {
                    const url = e.target.value;
                    setVideoForm(p => ({ ...p, url }));
                    if (url && /\.(mp4|webm|ogg)/i.test(url)) {
                      const duration = await getVideoDuration(url);
                      setVideoForm(p => ({ ...p, duration }));
                    }
                  }}
                  placeholder="https://youtube.com/... or upload file"
                  className="text-sm flex-1"
                />
                <label className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-800
                  hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors text-gray-500">
                  <Upload size={14} />
                  <input type="file" accept="video/*" className="hidden" onChange={e => handleFileUpload(e, 'url')} />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Supports YouTube, Vimeo, or direct video files (.mp4, .webm)</p>
            </div>

            {videoForm.duration && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Duration detected: {videoForm.duration}
                </span>
              </div>
            )}
          </form>
          <div className="px-6 py-4 border-t dark:border-zinc-800 flex gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsVideoDrawerOpen(false)} className="flex-1 h-10">
              Cancel
            </Button>
            <Button
              type="submit"
              form="video-form"
              onClick={handleVideoSubmit}
              className="flex-1 bg-[#e53935] hover:bg-[#c62828] text-white h-10"
            >
              <Plus size={15} className="mr-1.5" /> Add Video
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <Link to="/"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 tracking-tight">
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                <Clock size={11} />
                <span>{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="font-mono tabular-nums">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                {trends.todayArticles > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-zinc-700">·</span>
                    <span className="text-emerald-500 font-medium">+{trends.todayArticles} today</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400
                hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Eye size={13} /> View Site
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600
                hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30
                rounded-xl transition-colors border border-red-100 dark:border-red-900/30"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="lg:flex lg:gap-6">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:flex flex-col w-52 shrink-0 self-start sticky top-6">
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-2.5 shadow-xl">
              <div className="px-2 py-3 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#e53935] flex items-center justify-center">
                    <Newspaper size={12} className="text-white" />
                  </div>
                  <div className="text-white font-display font-bold text-sm tracking-wide">FMN Admin</div>
                </div>
                <div className="text-zinc-500 text-[11px] mt-2 px-0.5">Content Management</div>
              </div>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all text-left mb-0.5
                    ${activeTab === item.id
                      ? 'bg-[#e53935] text-white shadow-lg shadow-[#e53935]/25'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon size={15} />
                    {item.label}
                  </span>
                  {item.count !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center
                      ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
              {/* Logged-in user pill */}
              <div className="mt-2 pt-2 border-t border-zinc-800 px-2 pb-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#e53935] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {currentUsername ? currentUsername[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{currentUsername || 'Admin'}</p>
                    <p className="text-[10px] text-zinc-500">{isSuperAdmin ? 'Superadmin' : 'Admin'}</p>
                  </div>
                </button>
              </div>

              <div className="mt-1 pt-2 border-t border-zinc-800">
                <div className="px-3 py-2">
                  <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide mb-2">Shortcuts</div>
                  <div className="space-y-1 text-[11px] text-zinc-500">
                    <div className="flex items-center justify-between">
                      <span>Search</span>
                      <KbdBadge>/</KbdBadge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Close</span>
                      <KbdBadge>Esc</KbdBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Mobile Tab Bar ── */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-3 mb-5 -mx-4 px-4 scrollbar-none">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap
                  shrink-0 transition-all
                  ${activeTab === item.id
                    ? 'bg-[#e53935] text-white shadow-sm shadow-[#e53935]/30'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              >
                <item.icon size={13} />
                {item.label}
                {item.count !== undefined && (
                  <span className={`text-[10px] font-bold
                    ${activeTab === item.id ? 'text-white/80' : 'text-gray-400 dark:text-zinc-500'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">

            {/* Per-tab action button */}
            {(activeTab === 'articles' || activeTab === 'videos' || activeTab === 'images') && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  {activeTab === 'articles' && `${articles.length} articles total`}
                  {activeTab === 'videos' && `${videoStories.length} video stories`}
                  {activeTab === 'images' && `${allImages.length} images in library`}
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'articles' && (
                    <>
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400
                          bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                        title="Export as CSV"
                      >
                        <Download size={13} /> Export
                      </button>
                      <Link to="/admin/create">
                        <Button className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm h-9 px-4 rounded-xl shadow-sm shadow-[#e53935]/20">
                          <Plus size={15} className="mr-1.5" /> New Article
                        </Button>
                      </Link>
                    </>
                  )}
                  {activeTab === 'videos' && (
                    <Button
                      onClick={() => { setVideoForm({ title: '', duration: '', image: '', url: '' }); setIsVideoDrawerOpen(true); }}
                      className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm h-9 px-4 rounded-xl shadow-sm shadow-[#e53935]/20"
                    >
                      <Plus size={15} className="mr-1.5" /> New Video
                    </Button>
                  )}
                  {activeTab === 'images' && (
                    <label className="flex items-center gap-1.5 h-9 px-4 bg-[#e53935] hover:bg-[#c62828]
                      text-white text-sm font-medium rounded-xl cursor-pointer transition-colors shadow-sm shadow-[#e53935]/20">
                      <Upload size={15} /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageInputChange} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ OVERVIEW ════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Primary gradient stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <GradientStatCard
                    icon={Newspaper} label="Total Articles" value={articles.length}
                    gradient="linear-gradient(135deg, #1d4ed8, #3b82f6)"
                    sparkData={weeklyTrend} trend={trends.articleTrend}
                  />
                  <GradientStatCard
                    icon={Eye} label="Total Views" value={totalViews}
                    gradient="linear-gradient(135deg, #065f46, #10b981)"
                    sparkData={weeklyTrend.map(v => v * 12)}
                  />
                  <GradientStatCard
                    icon={MessageSquare} label="Comments" value={totalComments}
                    gradient="linear-gradient(135deg, #5b21b6, #8b5cf6)"
                    sparkData={weeklyComments} trend={trends.commentTrend}
                  />
                  <GradientStatCard
                    icon={Video} label="Videos" value={videoStories.length}
                    gradient="linear-gradient(135deg, #9a3412, #f97316)"
                    sparkData={weeklyTrend}
                  />
                </div>

                {/* Secondary small stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <SmallStatCard icon={Star} label="Featured Articles" value={featuredCount} color="#f59e0b" />
                  <SmallStatCard icon={Zap} label="Breaking Headlines" value={breakingNews.length} color="#e53935" />
                  <SmallStatCard icon={TrendingUp} label="Trending Topics" value={trendingTopics.length} color="#10b981" />
                  <SmallStatCard icon={BarChart2} label="Categories" value={config.categories.length} color="#8b5cf6" />
                </div>

                {/* Recent articles + Activity feed + Category breakdown */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Recent articles */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between px-5 py-4 border-b dark:border-zinc-800">
                      <h3 className="font-semibold text-sm text-[#1a1a1a] dark:text-zinc-100">Recent Articles</h3>
                      <button
                        onClick={() => setActiveTab('articles')}
                        className="text-xs text-[#e53935] hover:underline font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    {recentArticles.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 text-sm">No articles yet.</div>
                    ) : (
                      <div className="divide-y dark:divide-zinc-800">
                        {recentArticles.map(article => (
                          <div
                            key={article.id}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/60
                              transition-colors group"
                          >
                            <img src={article.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-[#1a1a1a] dark:text-zinc-100 line-clamp-1">
                                  {article.title}
                                </p>
                                {isNew(article.createdAt) && (
                                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700
                                    dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold uppercase tracking-wide">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                  ${categoryColors[article.category] || 'bg-gray-100 text-gray-600'}`}>
                                  {article.category}
                                </span>
                                {article.featured && (
                                  <span className="text-[10px] flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                                    <Star size={9} fill="currentColor" /> Featured
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                  {new Date(article.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/article/${article.id}`}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                <Eye size={13} className="text-gray-500" />
                              </Link>
                              <Link to={`/admin/edit/${article.id}`}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg transition-colors">
                                <Edit2 size={13} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category breakdown */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm mb-4 text-[#1a1a1a] dark:text-zinc-100">By Category</h3>
                    {categoryStats.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-4">No data yet.</div>
                    ) : (
                      <div className="space-y-3.5">
                        {categoryStats.slice(0, 8).map(({ cat, count, pct }, i) => (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">{cat}</span>
                              <span className="text-xs font-bold text-[#1a1a1a] dark:text-zinc-100">{count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(pct, 3)}%`,
                                  backgroundColor: categoryColorList[i % categoryColorList.length],
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Feed */}
                {activityFeed.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 px-5 py-4 border-b dark:border-zinc-800">
                      <Activity size={14} className="text-[#e53935]" />
                      <h3 className="font-semibold text-sm text-[#1a1a1a] dark:text-zinc-100">Recent Activity</h3>
                    </div>
                    <div className="divide-y dark:divide-zinc-800">
                      {activityFeed.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="flex items-start gap-3 px-5 py-3">
                          <div className={`mt-1 w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                            ${item.type === 'article' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                            {item.type === 'article'
                              ? <Newspaper size={13} className="text-blue-500" />
                              : <MessageSquare size={13} className="text-purple-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#1a1a1a] dark:text-zinc-100 line-clamp-1">{item.title}</p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 line-clamp-1 mt-0.5">{item.sub}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap mt-1">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ ARTICLES ════════════════ */}
            {activeTab === 'articles' && (
              <div>
                {/* Search + Filters */}
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        ref={searchRef}
                        id="article-search"
                        placeholder="Search articles, authors…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm h-9 rounded-xl"
                      />
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={13} />
                        </button>
                      ) : (
                        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex
                          items-center px-1.5 py-0.5 text-[10px] font-mono pointer-events-none
                          bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500
                          border border-gray-200 dark:border-zinc-700 rounded">
                          /
                        </kbd>
                      )}
                    </div>
                    {/* Status filter */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shrink-0">
                      {['', 'published', 'draft'].map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors
                            ${filterStatus === s
                              ? 'bg-[#e53935] text-white'
                              : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                        >
                          {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setFilterCategory('')}
                      className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-all border
                        ${filterCategory === ''
                          ? 'bg-[#e53935] text-white border-[#e53935]'
                          : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-[#e53935] hover:text-[#e53935]'}`}
                    >
                      All Categories
                    </button>
                    {config.categories.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setFilterCategory(cat.name === filterCategory ? '' : cat.name)}
                        className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-all border
                          ${filterCategory === cat.name
                            ? 'bg-[#e53935] text-white border-[#e53935]'
                            : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-[#e53935] hover:text-[#e53935]'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk action bar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 mb-3 bg-zinc-900 dark:bg-zinc-950
                    rounded-xl text-white shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-medium">
                      <span className="text-[#e53935] font-bold">{selectedIds.size}</span> article{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                      >
                        Deselect all
                      </button>
                      <button
                        onClick={bulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700
                          text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Trash2 size={12} /> Delete selected
                      </button>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {sortedArticles.length === 0 ? (
                    <div className="p-12 text-center">
                      <Newspaper size={40} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">No articles match your filters.</p>
                      <button onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterStatus(''); }}
                        className="text-xs text-[#e53935] hover:underline font-medium">
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
                          <tr>
                            <th className="px-4 py-3 w-10">
                              <input
                                type="checkbox"
                                checked={paginatedArticles.length > 0 && selectedIds.size === paginatedArticles.length}
                                onChange={toggleSelectAll}
                                className="rounded accent-[#e53935] cursor-pointer"
                              />
                            </th>
                            <SortTh field="title" label="Article" current={sortBy} dir={sortDir} onClick={toggleSort} />
                            <SortTh field="category" label="Category" current={sortBy} dir={sortDir} onClick={toggleSort} className="hidden sm:table-cell" />
                            <SortTh field="status" label="Status" current={sortBy} dir={sortDir} onClick={toggleSort} className="hidden md:table-cell" />
                            <SortTh field="views" label="Views" current={sortBy} dir={sortDir} onClick={toggleSort} className="hidden lg:table-cell" />
                            <SortTh field="date" label="Date" current={sortBy} dir={sortDir} onClick={toggleSort} className="hidden lg:table-cell" />
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-zinc-800">
                          {paginatedArticles.map(article => (
                            <tr
                              key={article.id}
                              className={`hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors
                                ${selectedIds.has(article.id) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                            >
                              <td className="px-4 py-3 w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(article.id)}
                                  onChange={() => toggleSelect(article.id)}
                                  className="rounded accent-[#e53935] cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={article.image} alt=""
                                    className="w-9 h-9 rounded-lg object-cover shrink-0 hidden sm:block"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-medium text-sm text-[#1a1a1a] dark:text-zinc-100 line-clamp-1">
                                        {article.title}
                                      </p>
                                      {article.featured && <Star size={11} className="text-yellow-500 shrink-0" fill="currentColor" />}
                                      {isNew(article.createdAt) && (
                                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700
                                          dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold uppercase tracking-wide">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 sm:hidden mt-0.5">
                                      {article.category}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                                  ${categoryColors[article.category] || 'bg-gray-100 text-gray-600'}`}>
                                  {article.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <button
                                  onClick={() => handleToggleStatus(article.id, article.status || 'published')}
                                  title="Click to toggle status"
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                    cursor-pointer transition-all hover:opacity-75 active:scale-95
                                    ${(article.status || 'published') === 'published'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                                >
                                  {(article.status || 'published') === 'published'
                                    ? <ToggleRight size={11} />
                                    : <ToggleLeft size={11} />}
                                  {(article.status || 'published').charAt(0).toUpperCase() + (article.status || 'published').slice(1)}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 hidden lg:table-cell">
                                {(article.views || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500 hidden lg:table-cell whitespace-nowrap">
                                {new Date(article.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Link to={`/article/${article.id}`}>
                                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="View">
                                      <Eye size={14} className="text-gray-500 dark:text-zinc-400" />
                                    </button>
                                  </Link>
                                  <Link to={`/admin/edit/${article.id}`}>
                                    <button className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg transition-colors" title="Edit">
                                      <Edit2 size={14} />
                                    </button>
                                  </Link>
                                  <ConfirmDelete
                                    id={article.id}
                                    confirmKey={confirmId}
                                    onRequest={() => setConfirmId(article.id)}
                                    onConfirm={() => {
                                      deleteArticle(article.id);
                                      setConfirmId(null);
                                      toast('Article deleted');
                                    }}
                                    onCancel={() => setConfirmId(null)}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Pagination + count */}
                {sortedArticles.length > 0 && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {sortedArticles.length} of {articles.length} articles
                      {searchQuery && ` · "${searchQuery}"`}
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30
                            disabled:cursor-not-allowed transition-colors text-gray-500 dark:text-zinc-400"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                          if (pg > totalPages) return null;
                          return (
                            <button
                              key={pg}
                              onClick={() => setPage(pg)}
                              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                                ${page === pg
                                  ? 'bg-[#e53935] text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'}`}
                            >
                              {pg}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30
                            disabled:cursor-not-allowed transition-colors text-gray-500 dark:text-zinc-400"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ COMMENTS ════════════════ */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search comments by author, content, or article…"
                    value={commentSearch}
                    onChange={e => setCommentSearch(e.target.value)}
                    className="pl-9 text-sm h-9 rounded-xl"
                  />
                  {commentSearch && (
                    <button
                      onClick={() => setCommentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {filteredComments.length === 0 ? (
                    <div className="py-16 text-center">
                      <MessageSquare size={40} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                      <p className="text-sm text-gray-400 dark:text-zinc-500">
                        {commentSearch ? 'No comments match your search.' : 'No comments yet across any articles.'}
                      </p>
                      {commentSearch && (
                        <button onClick={() => setCommentSearch('')}
                          className="text-xs text-[#e53935] hover:underline font-medium mt-2">
                          Clear search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y dark:divide-zinc-800">
                      {filteredComments.map(({ comment, articleId, articleTitle }) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300
                            dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center
                            text-xs font-bold text-gray-600 dark:text-zinc-300 shrink-0 uppercase">
                            {comment.author?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-semibold text-[#1a1a1a] dark:text-zinc-100">
                                {comment.author || 'Anonymous'}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-zinc-300 line-clamp-2 mb-1.5">
                              {comment.content}
                            </p>
                            <Link
                              to={`/article/${articleId}`}
                              className="text-[10px] text-[#e53935] hover:underline font-medium"
                            >
                              On: {articleTitle}
                            </Link>
                          </div>
                          <ConfirmDelete
                            id={comment.id}
                            confirmKey={confirmCommentId}
                            onRequest={() => setConfirmCommentId(comment.id)}
                            onConfirm={() => {
                              deleteComment(articleId, comment.id);
                              setConfirmCommentId(null);
                              toast('Comment removed');
                            }}
                            onCancel={() => setConfirmCommentId(null)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {allComments.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 text-right">
                    {commentSearch ? `${filteredComments.length} of ` : ''}{allComments.length} total comments
                  </p>
                )}
              </div>
            )}

            {/* ════════════════ VIDEOS ════════════════ */}
            {activeTab === 'videos' && (
              <div>
                {videoStories.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed
                    border-gray-200 dark:border-zinc-700">
                    <Video size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">No video stories yet.</p>
                    <button
                      onClick={() => { setVideoForm({ title: '', duration: '', image: '', url: '' }); setIsVideoDrawerOpen(true); }}
                      className="text-sm text-[#e53935] font-medium hover:underline"
                    >
                      Add your first video →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videoStories.map(video => (
                      <div
                        key={video.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden
                          border border-gray-100 dark:border-zinc-800 group transition-all hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="relative h-44">
                          <img src={video.image} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                            transition-opacity flex items-center justify-center">
                            <ConfirmDelete
                              id={video.id}
                              confirmKey={confirmId}
                              onRequest={() => setConfirmId(video.id)}
                              onConfirm={() => {
                                deleteVideoStory(video.id);
                                setConfirmId(null);
                                toast('Video removed');
                              }}
                              onCancel={() => setConfirmId(null)}
                            />
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/80 text-white text-[11px]
                            font-bold rounded-lg backdrop-blur-sm">
                            {video.duration || '--:--'}
                          </div>
                        </div>
                        <div className="p-3.5">
                          <p className="font-semibold text-sm text-[#1a1a1a] dark:text-zinc-100 line-clamp-1">
                            {video.title}
                          </p>
                          {video.url && (
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                              {video.url.startsWith('data:') ? 'Uploaded file' : video.url}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ TRENDING ════════════════ */}
            {activeTab === 'trending' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold text-sm mb-3 text-[#1a1a1a] dark:text-zinc-100">Add Trending Topic</h3>
                  <form onSubmit={handleAddTrendingTopic} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="#TopicName"
                      value={trendingForm.tag}
                      onChange={e => setTrendingForm(p => ({ ...p, tag: e.target.value }))}
                      className="text-sm flex-1 rounded-xl"
                    />
                    <Input
                      placeholder="Count (e.g. 10K)"
                      value={trendingForm.count}
                      onChange={e => setTrendingForm(p => ({ ...p, count: e.target.value }))}
                      className="text-sm sm:w-36 rounded-xl"
                    />
                    <Button type="submit"
                      className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm h-9 shrink-0 rounded-xl">
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </form>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {trendingTopics.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 dark:text-zinc-500 text-sm">No trending topics yet.</div>
                  ) : (
                    <div className="divide-y dark:divide-zinc-800">
                      {trendingTopics.map((topic, i) => (
                        <div
                          key={topic.id}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center
                            justify-center text-[11px] font-bold text-gray-400 dark:text-zinc-500 shrink-0">
                            {i + 1}
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-[#e53935]/10 dark:bg-[#e53935]/20
                            flex items-center justify-center shrink-0">
                            <TrendingUp size={14} className="text-[#e53935]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1a1a1a] dark:text-zinc-100">{topic.tag}</p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">{topic.count} interactions</p>
                          </div>
                          <ConfirmDelete
                            id={topic.id}
                            confirmKey={confirmId}
                            onRequest={() => setConfirmId(topic.id)}
                            onConfirm={() => {
                              deleteTrendingTopic(topic.id);
                              setConfirmId(null);
                              toast('Trending topic removed');
                            }}
                            onCancel={() => setConfirmId(null)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════ BREAKING NEWS ════════════════ */}
            {activeTab === 'breaking' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold text-sm mb-3 text-[#1a1a1a] dark:text-zinc-100">Add Breaking Headline</h3>
                  <form onSubmit={handleAddBreakingNews} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter breaking news headline..."
                      value={newBreakingNews}
                      onChange={e => setNewBreakingNews(e.target.value)}
                      className="text-sm flex-1 rounded-xl"
                    />
                    <Button type="submit"
                      className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm h-9 shrink-0 rounded-xl">
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </form>
                </div>

                {/* Live ticker preview */}
                {breakingNews.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 px-5 py-3 border-b dark:border-zinc-800">
                      <Eye size={13} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Ticker Preview</span>
                    </div>
                    <div className="bg-[#e53935] px-4 py-2.5 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 bg-white text-[#e53935] text-[10px] font-display font-black
                          uppercase tracking-widest px-2 py-0.5 rounded">
                          Breaking
                        </span>
                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
                          {breakingNews.map((news, i) => (
                            <span key={i} className="shrink-0 text-white text-[13px] font-medium whitespace-nowrap">
                              {i > 0 && <span className="mr-6 text-white/40">·</span>}
                              {news}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {breakingNews.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 dark:text-zinc-500 text-sm">No breaking headlines yet.</div>
                  ) : (
                    <div className="divide-y dark:divide-zinc-800">
                      {breakingNews.map((news, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="mt-1.5 shrink-0">
                            <div className="w-2 h-2 bg-[#e53935] rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1a1a1a] dark:text-zinc-100 leading-relaxed">{news}</p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Headline #{index + 1}</p>
                          </div>
                          <ConfirmDelete
                            id={index}
                            confirmKey={confirmId}
                            onRequest={() => setConfirmId(index)}
                            onConfirm={() => {
                              deleteBreakingNews(index);
                              setConfirmId(null);
                              toast('Headline removed');
                            }}
                            onCancel={() => setConfirmId(null)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {breakingNews.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 text-right">
                    {breakingNews.length} active headline{breakingNews.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* ════════════════ IMAGES ════════════════ */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                {/* Drag & drop upload zone */}
                <div
                  ref={dropRef}
                  onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-8
                    flex flex-col items-center justify-center gap-3 cursor-pointer
                    ${isDraggingOver
                      ? 'border-[#e53935] bg-red-50 dark:bg-red-900/10 scale-[1.01]'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'}`}
                >
                  <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                      ${isDraggingOver ? 'bg-[#e53935]/15' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                      <Upload size={24} className={isDraggingOver ? 'text-[#e53935]' : 'text-gray-400'} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        {isDraggingOver ? 'Drop to upload' : 'Drag & drop images here'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                        or <span className="text-[#e53935] font-medium">browse files</span> · PNG, JPG, GIF, WEBP
                      </p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageInputChange} />
                  </label>
                </div>

                {/* Image grid */}
                {allImages.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-sm">
                    No images in the library yet.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Library <span className="font-normal text-gray-400">({allImages.length})</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {allImages.map((img, i) => (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800
                            shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex
                            items-end justify-center pb-3 gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => copyImageUrl(img)}
                              className="p-2 bg-white/90 hover:bg-white rounded-xl transition-colors shadow-sm"
                              title="Copy URL"
                            >
                              <Copy size={13} className="text-gray-700" />
                            </button>
                            <ConfirmDelete
                              id={i}
                              confirmKey={confirmId}
                              onRequest={() => setConfirmId(i)}
                              onConfirm={() => {
                                deleteImage(img);
                                setConfirmId(null);
                                toast('Image removed from library');
                              }}
                              onCancel={() => setConfirmId(null)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ════════════════ ACCOUNTS (Superadmin only) ════════════════ */}
            {activeTab === 'accounts' && isSuperAdmin && (
              <div className="space-y-4">
                {/* Create account */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-[#e53935]" />
                    <h3 className="font-semibold text-sm text-[#1a1a1a] dark:text-zinc-100">Create Admin Account</h3>
                  </div>
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      setAccountError('');
                      setAccountLoading(true);
                      try {
                        await createAdminAccount(newAccount.username, newAccount.password, newAccount.role);
                        setNewAccount({ username: '', password: '', role: 'admin' });
                        toast('Account created successfully');
                      } catch (err: unknown) {
                        setAccountError(err instanceof Error ? err.message : 'Failed to create account');
                      } finally {
                        setAccountLoading(false);
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <Input
                      placeholder="Username"
                      value={newAccount.username}
                      onChange={e => setNewAccount(p => ({ ...p, username: e.target.value }))}
                      required
                      className="text-sm rounded-xl flex-1"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newAccount.password}
                      onChange={e => setNewAccount(p => ({ ...p, password: e.target.value }))}
                      required
                      className="text-sm rounded-xl flex-1"
                    />
                    <select
                      value={newAccount.role}
                      onChange={e => setNewAccount(p => ({ ...p, role: e.target.value }))}
                      className="text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-700 dark:text-zinc-200"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <Button type="submit" disabled={accountLoading} className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm h-9 shrink-0 rounded-xl">
                      <Plus size={14} className="mr-1" /> Create
                    </Button>
                  </form>
                  {accountError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle size={12} />{accountError}</p>
                  )}
                </div>

                {/* Accounts list */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                  <div className="px-5 py-3 border-b dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1a1a1a] dark:text-zinc-100">
                      All Accounts <span className="font-normal text-gray-400">({adminAccounts.length})</span>
                    </p>
                  </div>
                  {adminAccounts.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-400 dark:text-zinc-500">No accounts found.</p>
                  ) : (
                    <div className="divide-y dark:divide-zinc-800">
                      {adminAccounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${account.role === 'superadmin' ? 'bg-[#e53935]' : 'bg-zinc-400'}`}>
                              {account.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1a1a1a] dark:text-zinc-100">{account.username}</p>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${account.role === 'superadmin' ? 'text-[#e53935]' : 'text-gray-400'}`}>{account.role}</p>
                            </div>
                          </div>
                          <ConfirmDelete
                            id={account.id}
                            confirmKey={confirmId}
                            onRequest={() => setConfirmId(account.id)}
                            onConfirm={async () => {
                              try {
                                await deleteAdminAccount(account.id);
                                toast('Account deleted');
                              } catch (err: unknown) {
                                toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
                              }
                              setConfirmId(null);
                            }}
                            onCancel={() => setConfirmId(null)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="max-w-lg space-y-5">
                {/* Who's logged in */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#e53935] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/20">
                      {currentUsername ? currentUsername[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1a1a1a] dark:text-zinc-100">{currentUsername || 'Admin'}</h2>
                      <span className={`inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isSuperAdmin ? 'bg-[#e53935]/10 text-[#e53935] border border-[#e53935]/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                        {isSuperAdmin ? <ShieldCheck size={9} /> : <UserCircle size={9} />}
                        {isSuperAdmin ? 'Superadmin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e53935]/10 flex items-center justify-center">
                      <KeyRound size={15} className="text-[#e53935]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-zinc-100">Change Password</h3>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">Update your account password</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Current password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPwCurrent ? 'text' : 'password'}
                          placeholder="Enter current password"
                          value={pwForm.current}
                          onChange={e => { setPwForm(p => ({ ...p, current: e.target.value })); setPwError(''); setPwSuccess(false); }}
                          className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:border-[#e53935]/50 transition-all"
                        />
                        <button type="button" onClick={() => setShowPwCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 transition-colors">
                          {showPwCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">New Password</label>
                      <div className="relative">
                        <input
                          type={showPwNext ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={pwForm.next}
                          onChange={e => { setPwForm(p => ({ ...p, next: e.target.value })); setPwError(''); setPwSuccess(false); }}
                          className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:border-[#e53935]/50 transition-all"
                        />
                        <button type="button" onClick={() => setShowPwNext(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 transition-colors">
                          {showPwNext ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Repeat new password"
                        value={pwForm.confirm}
                        onChange={e => { setPwForm(p => ({ ...p, confirm: e.target.value })); setPwError(''); setPwSuccess(false); }}
                        className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:border-[#e53935]/50 transition-all"
                      />
                    </div>

                    {pwError && (
                      <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-2.5 text-xs">
                        <AlertCircle size={13} className="shrink-0" /> {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-4 py-2.5 text-xs">
                        <CheckCircle2 size={13} className="shrink-0" /> Password changed successfully
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                        onClick={async () => {
                          setPwError('');
                          if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
                          if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters'); return; }
                          setPwLoading(true);
                          try {
                            await changePassword(pwForm.current, pwForm.next);
                            setPwForm({ current: '', next: '', confirm: '' });
                            setPwSuccess(true);
                          } catch (err: unknown) {
                            setPwError(err instanceof Error ? err.message : 'Failed to change password');
                          } finally {
                            setPwLoading(false);
                          }
                        }}
                        className="bg-[#e53935] hover:bg-[#c62828] disabled:opacity-50 text-white text-sm h-9 px-5 rounded-xl shadow-sm shadow-[#e53935]/20"
                      >
                        {pwLoading ? 'Saving…' : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
