import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, User, ArrowLeft, Share2, Facebook, Twitter,
  Bookmark, MessageCircle, ThumbsUp, Sparkles,
  ChevronDown, ChevronUp, Verified, Globe, Mail,
  RefreshCw, AlertCircle, BookOpen,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  MinusCircle, Info, ExternalLink, Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNews } from '@/context/NewsContextCore';
import { CommentSection } from '@/components/CommentSection';
import { StickyShareSidebar } from '@/components/StickyShareSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { timeAgo } from '@/utils/timeAgo';
import { calculateReadingTime } from '@/utils/readingTime';
import { TableOfContents } from '@/components/TableOfContents';
import { renderContent } from '@/utils/contentRenderer';
import { ArticleReactions } from '@/components/ArticleReactions';
import { TextSelectionPopup } from '@/components/TextSelectionPopup';
import { ImageLightbox } from '@/components/ImageLightbox';

const FACT_CHECK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'True':        { label: 'TRUE', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-300 dark:border-green-800', icon: <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" /> },
  'False':       { label: 'FALSE', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-300 dark:border-red-800', icon: <XCircle size={28} className="text-red-600 dark:text-red-400" /> },
  'Misleading':  { label: 'MISLEADING', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-800', icon: <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" /> },
  'Partly True': { label: 'PARTLY TRUE', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-300 dark:border-blue-800', icon: <MinusCircle size={28} className="text-blue-600 dark:text-blue-400" /> },
  'Unverified':  { label: 'UNVERIFIED', color: 'text-gray-600 dark:text-zinc-400', bg: 'bg-gray-50 dark:bg-zinc-900/40', border: 'border-gray-300 dark:border-zinc-700', icon: <HelpCircle size={28} className="text-gray-500 dark:text-zinc-500" /> },
};

const ARTICLE_TYPE_STYLES: Record<string, string> = {
  'Analysis':      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Opinion':       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Explainer':     'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Fact Check':    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Feature':       'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Exclusive':     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'In Depth':      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Investigation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticleById, articles, isAdmin, deleteArticle, categoryColors } = useNews();
  const [showSummary, setShowSummary] = useState(false);
  const [showAuthorCard, setShowAuthorCard] = useState(false);
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fmn_font_size') || '18'));
  const [serifFont, setSerifFont] = useState(() => localStorage.getItem('fmn_serif') === '1');
  const [showAbout, setShowAbout] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    try { return (JSON.parse(localStorage.getItem('fmn_saved') || '[]') as string[]).includes(id || ''); } catch { return false; }
  });
  const [isLiked, setIsLiked] = useState(() => {
    try { return (JSON.parse(localStorage.getItem('fmn_liked') || '[]') as string[]).includes(id || ''); } catch { return false; }
  });

  const toggleSave = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('fmn_saved') || '[]');
      const updated = isSaved ? saved.filter(s => s !== id) : [...saved, id!];
      localStorage.setItem('fmn_saved', JSON.stringify(updated));
      window.dispatchEvent(new Event('fmn_saved_change'));
      setIsSaved(!isSaved);
    } catch { /* ignore */ }
  };

  const toggleLike = () => {
    try {
      const liked: string[] = JSON.parse(localStorage.getItem('fmn_liked') || '[]');
      const updated = isLiked ? liked.filter(l => l !== id) : [...liked, id!];
      localStorage.setItem('fmn_liked', JSON.stringify(updated));
      setIsLiked(!isLiked);
    } catch { /* ignore */ }
  };

  const article = getArticleById(id || '');

  const wordCount = article ? article.content.trim().split(/\s+/).length : 0;

  // Count articles by this author (for badge in hover card)
  const authorArticleCount = article ? articles.filter(a => a.author === article.author).length : 0;

  // Get series articles (same series name, sorted by part)
  const seriesArticles = (() => {
    if (!article?.series) return [];
    return articles
      .filter(a => a.series === article.series)
      .sort((a, b) => (a.seriesPart || 0) - (b.seriesPart || 0));
  })();

  // Get related articles — prefer tag overlap, fall back to same category
  const relatedArticles = (() => {
    if (!article) return [];
    const currentTags = new Set(article.tags || []);
    const scored = articles
      .filter(a => a.id !== id)
      .map(a => {
        const tagOverlap = (a.tags || []).filter(t => currentTags.has(t)).length;
        const sameCategory = a.category === article.category ? 1 : 0;
        return { article: a, score: tagOverlap * 2 + sameCategory };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.length >= 3
      ? scored.slice(0, 3).map(({ article: a }) => a)
      : articles.filter(a => a.category === article.category && a.id !== id).slice(0, 3);
  })();


  // Track view count (fire once per article id)
  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
    fetch(`${apiBase}/articles/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  // Save to reading history (used by homepage "Continue Reading" strip)
  useEffect(() => {
    if (!id || !article) return;
    try {
      const hist: string[] = JSON.parse(localStorage.getItem('fmn_history') || '[]');
      const updated = [id, ...hist.filter(h => h !== id)].slice(0, 20);
      localStorage.setItem('fmn_history', JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [id, article?.title]);

  // Persist font preferences
  useEffect(() => { localStorage.setItem('fmn_font_size', String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem('fmn_serif', serifFont ? '1' : '0'); }, [serifFont]);

  // Save reading progress to localStorage
  useEffect(() => {
    if (!id) return;
    const saveProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.round((window.scrollY / total) * 100) : 0;
      localStorage.setItem(`fmn_read_${id}`, String(pct));
    };
    window.addEventListener('scroll', saveProgress, { passive: true });
    return () => window.removeEventListener('scroll', saveProgress);
  }, [id]);


  if (articles.length === 0) {
    return (
      <div className="py-8 max-w-4xl mx-auto px-4 space-y-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 dark:bg-zinc-950 transition-colors duration-300">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-4">Article Not Found</h1>
        <p className="text-gray-600 dark:text-zinc-400 mb-6 text-center">The article you're looking for doesn't exist or has been removed.</p>
        <Link to="/">
          <Button className="bg-[#e53935] hover:bg-[#c62828] text-white">
            <ArrowLeft size={18} className="mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteArticle(article.id);
      navigate('/');
    }
  };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmnnews.co';
  const articleUrl = `${siteUrl}/article/${article.id}`;

  return (
    <div className="py-4 sm:py-6 lg:py-8">
      {/* Open Graph / SEO meta tags — React 19 hoists these to <head> */}
      <title>{article.title} – FMN News</title>
      <meta name="description" content={article.excerpt} />
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={article.excerpt} />
      <meta property="og:image" content={article.image.startsWith('data:') ? `${siteUrl}/og-default.jpg` : article.image} />
      <meta property="og:url" content={articleUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="FMN News" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={article.excerpt} />
      <meta name="twitter:image" content={article.image.startsWith('data:') ? `${siteUrl}/og-default.jpg` : article.image} />
      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          <Link to="/" className="hover:text-[#e53935] transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/category/${article.category.toLowerCase()}`} className="hover:text-[#e53935] transition-colors">
            {article.category}
          </Link>
          <span>/</span>
          <span className="truncate max-w-[150px] sm:max-w-xs">{article.title}</span>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex gap-2 mb-4 sm:mb-6">
            <Link to={`/admin/edit/${article.id}`}>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Edit Article
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs sm:text-sm">
              Delete
            </Button>
          </div>
        )}

        {/* Correction Notice */}
        {article.correction && (
          <div className="mb-6 flex gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Correction</p>
              <p className="text-sm text-red-800 dark:text-red-300">{article.correction}</p>
            </div>
          </div>
        )}

        {/* Fact-Check Verdict */}
        {article.factCheckVerdict && FACT_CHECK_CONFIG[article.factCheckVerdict] && (() => {
          const cfg = FACT_CHECK_CONFIG[article.factCheckVerdict];
          return (
            <div className={`mb-6 flex items-center gap-4 p-5 rounded-xl border-2 ${cfg.bg} ${cfg.border}`}>
              {cfg.icon}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 mb-0.5">Fact Check Verdict</p>
                <p className={`text-2xl font-black tracking-tight ${cfg.color}`}>{cfg.label}</p>
              </div>
            </div>
          );
        })()}

        {/* Series Banner */}
        {article.series && article.seriesPart && (
          <div className="mb-5 flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
            <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
              Part {article.seriesPart}{article.seriesTotal ? ` of ${article.seriesTotal}` : ''}: {article.series}
            </p>
          </div>
        )}

        {/* Category & Article Type & Title */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-[#EB483B]">
            {article.category}
          </span>
          {article.articleType && article.articleType !== 'News' && (
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${ARTICLE_TYPE_STYLES[article.articleType] || 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
              {article.articleType}
            </span>
          )}
          {article.isBreaking && (
            <span className="badge-live">
              <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" />LIVE
            </span>
          )}
        </div>
        <h1 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1a1a1a] dark:text-zinc-100 mb-6 leading-tight tracking-tight reveal-up ${article.articleType === 'Opinion' ? 'italic' : ''}`}>
          {article.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-500 dark:text-zinc-400 text-xs sm:text-sm mb-6 sm:mb-8 pb-6 sm:pb-8 border-b dark:border-zinc-800 reveal-up delay-200">
          <div className="relative">
            <button
              onMouseEnter={() => setShowAuthorCard(true)}
              onMouseLeave={() => setShowAuthorCard(false)}
              className="flex items-center gap-1.5 hover:text-[#EB483B] transition-colors font-bold"
            >
              <User size={14} />
              {article.author}
              <Verified size={12} className="text-blue-500" />
            </button>

            {showAuthorCard && (
              <div className="absolute top-full left-0 mt-2 w-64 glass dark:bg-zinc-900 border border-white/20 dark:border-white/10 p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {article.authorRel?.avatar
                      ? <img src={article.authorRel.avatar} alt={article.author} className="w-full h-full object-cover" />
                      : <User size={24} className="text-gray-400" />
                    }
                  </div>
                  <div>
                    <h5 className="font-bold dark:text-zinc-100">{article.author}</h5>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{article.authorRel?.title || 'Staff Writer'}</p>
                    <p className="text-[10px] text-[#EB483B] font-bold mt-0.5">{authorArticleCount} article{authorArticleCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {article.authorRel?.bio && (
                  <p className="text-[11px] text-gray-600 dark:text-zinc-400 mb-3 leading-relaxed line-clamp-3">
                    {article.authorRel.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  {article.authorRel?.website && <a href={article.authorRel.website} target="_blank" rel="noopener noreferrer"><Globe size={14} className="hover:text-[#EB483B] cursor-pointer" /></a>}
                  {article.authorRel?.twitter && <a href={article.authorRel.twitter} target="_blank" rel="noopener noreferrer"><Twitter size={14} className="hover:text-blue-400 cursor-pointer" /></a>}
                  {article.authorRel?.email && <a href={`mailto:${article.authorRel.email}`}><Mail size={14} className="hover:text-green-500 cursor-pointer" /></a>}
                  {article.authorId && (
                    <a href={`/author/${article.authorId}`} className="text-[10px] ml-auto text-[#EB483B] hover:underline font-bold">View profile →</a>
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {timeAgo(article.createdAt, article.time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {article.readTime || calculateReadingTime(article.content)}
          </span>
          <span className="text-gray-400 dark:text-zinc-600">
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {article.comments?.length || 0} comments
          </span>
          {article.updatedAt && new Date(article.updatedAt).getTime() - new Date(article.createdAt).getTime() > 300_000 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <RefreshCw size={12} />
              Updated {timeAgo(article.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 mb-6 sm:mb-8 reveal-up delay-400">
        <div className="rounded-lg lg:rounded-xl overflow-hidden shadow-2xl">
          <ImageLightbox
            src={article.image}
            alt={article.title}
            caption={article.imageCaption}
            credit={article.imageCredit}
            imgClassName="w-full h-[250px] sm:h-[350px] lg:h-[450px] object-cover"
          />
        </div>
      </div>

      <StickyShareSidebar url={window.location.href} title={article.title} articleId={article.id} />

      {/* Quick Summary (TL;DR) */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className={`glass dark:bg-zinc-900/40 rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden transition-all duration-500 ${showSummary ? 'ring-2 ring-[#EB483B]/20 shadow-2xl shadow-red-500/5' : ''}`}>
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EB483B] to-[#c62828] flex items-center justify-center shadow-lg shadow-red-500/20">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EB483B]">Quick Summary (TL;DR)</span>
            </div>
            {showSummary ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          <div className={`transition-all duration-500 ease-in-out ${showSummary ? 'max-h-96 opacity-100 p-6 pt-0' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4 pt-4 border-t border-white/5">
              {article.content.split('.').slice(0, 3).map((sentence, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EB483B] shrink-0" />
                  <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {sentence.trim()}.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content + TOC */}
      <div className="max-w-6xl mx-auto px-4 reveal-up delay-600">
        <div className="flex gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0 prose prose-lg dark:prose-invert max-w-none" style={{ fontSize: `${fontSize}px`, fontFamily: serifFont ? 'Georgia, "Times New Roman", serif' : undefined }}>
            <TextSelectionPopup articleUrl={articleUrl} />
            <p className="article-lead-in">
              {article.excerpt}
            </p>
            <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 article-drop-cap">
              {/* AP-style dateline */}
              {article.dateline && (
                <span className="font-black text-[#1a1a1a] dark:text-zinc-100 mr-2">
                  {article.dateline.toUpperCase()}, {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} (FMN) —
                </span>
              )}
              {renderContent(article.content)}
            </div>
            {/* Editing by byline */}
            {article.editedBy && (
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
                Reporting by <span className="font-bold">{article.author}</span>; Editing by <span className="font-bold">{article.editedBy}</span>
              </p>
            )}

            {/* Last Verified */}
            {article.lastVerified && (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-zinc-600 mt-3">
                <CheckCircle2 size={12} className="text-green-500" />
                Information last verified: <span className="font-bold">{new Date(article.lastVerified).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            )}

            {/* Sources List */}
            {article.sources && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 mb-3 flex items-center gap-2">
                  <ExternalLink size={12} /> Sources
                </h4>
                <ol className="space-y-1.5">
                  {article.sources.split('\n').filter(Boolean).map((src, i) => {
                    const [label, url] = src.split('|').map(s => s.trim());
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-500 dark:text-zinc-500">
                        <span className="font-black text-[#EB483B] shrink-0">{i + 1}.</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[#EB483B] underline underline-offset-2">{label || url}</a>
                        ) : (
                          <span>{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* About This Article */}
            {article.aboutArticle && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAbout(v => !v)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600 hover:text-[#EB483B] transition-colors"
                >
                  <Info size={13} />
                  About This Article
                  {showAbout ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showAbout && (
                  <div className="mt-3 p-4 rounded-xl bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800">
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{article.aboutArticle}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* TOC Sidebar */}
          <div className="hidden xl:block w-56 shrink-0">
            <TableOfContents content={article.content} />
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
            {article.tags.map(tag => (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-[#EB483B] hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Series Navigation */}
        {seriesArticles.length > 1 && article.series && (
          <div className="mt-8 p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
              Series: {article.series}
            </p>
            <div className="flex flex-col gap-2">
              {seriesArticles.map(sa => (
                <Link
                  key={sa.id}
                  to={`/article/${sa.id}`}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${sa.id === article.id ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/20'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${sa.id === article.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700'}`}>
                    {sa.seriesPart || '?'}
                  </span>
                  <span className={`text-sm font-medium line-clamp-1 ${sa.id === article.id ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-700 dark:text-zinc-300'}`}>
                    {sa.title}
                  </span>
                </Link>
              ))}
            </div>
            {/* Prev / Next in series */}
            {(() => {
              const idx = seriesArticles.findIndex(a => a.id === article.id);
              const prev = idx > 0 ? seriesArticles[idx - 1] : null;
              const next = idx < seriesArticles.length - 1 ? seriesArticles[idx + 1] : null;
              if (!prev && !next) return null;
              return (
                <div className="flex justify-between mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-900/40">
                  {prev ? (
                    <Link to={`/article/${prev.id}`} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      <ChevronLeft size={14} /> Part {prev.seriesPart}
                    </Link>
                  ) : <span />}
                  {next ? (
                    <Link to={`/article/${next.id}`} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Part {next.seriesPart} <ChevronRightIcon size={14} />
                    </Link>
                  ) : <span />}
                </div>
              );
            })()}
          </div>
        )}

        {/* Share & Actions */}
        <div className="flex flex-wrap items-center gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 font-accent">Share:</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#1877f2] hover:text-white transition-colors" aria-label="Share on Facebook">
              <Facebook size={14} />
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#1da1f2] hover:text-white transition-colors" aria-label="Share on Twitter">
              <Twitter size={14} />
            </a>
            <button onClick={() => navigator.clipboard?.writeText(articleUrl)} className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#e53935] hover:text-white transition-colors" aria-label="Copy link">
              <Share2 size={14} />
            </button>
          </div>

          {/* Reactions */}
          <div className="flex items-center">
            <ArticleReactions articleId={article.id} />
          </div>

          {/* Font size */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-full px-3 py-2">
              <button onClick={() => setFontSize(s => Math.max(14, s - 2))} className="text-xs font-black text-gray-600 dark:text-zinc-300 hover:text-[#EB483B] transition-colors w-5" aria-label="Decrease font size">A−</button>
              <span className="w-px h-4 bg-gray-300 dark:bg-zinc-600" />
              <button onClick={() => setFontSize(s => Math.min(26, s + 2))} className="text-sm font-black text-gray-600 dark:text-zinc-300 hover:text-[#EB483B] transition-colors w-5" aria-label="Increase font size">A+</button>
              <span className="w-px h-4 bg-gray-300 dark:bg-zinc-600" />
              <button
                onClick={() => setSerifFont(v => !v)}
                className={`text-xs font-black transition-colors w-5 ${serifFont ? 'text-[#EB483B]' : 'text-gray-600 dark:text-zinc-300 hover:text-[#EB483B]'}`}
                title={serifFont ? 'Switch to sans-serif' : 'Switch to serif'}
                aria-label="Toggle serif font"
                style={{ fontFamily: 'Georgia, serif' }}
              >Aa</button>
            </div>
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider ${isLiked ? 'bg-[#EB483B] text-white' : 'bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
            >
              <ThumbsUp size={14} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              onClick={toggleSave}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider ${isSaved ? 'bg-[#EB483B] text-white' : 'bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              title={isSaved ? 'Remove from saved' : 'Save for later'}
            >
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection
          articleId={article.id}
          comments={article.comments}
        />
      </div>


      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 mt-12 sm:mt-16 pt-8 sm:pt-12 border-t">
          <h2 className="ap-section-header">Related Articles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedArticles.map((related) => (
              <Link key={related.id} to={`/article/${related.id}`}>
                <div className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group card-hover">
                  <div className="h-36 sm:h-40 overflow-hidden img-zoom">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-accent font-semibold mb-2 ${categoryColors[related.category]}`}>
                      {related.category}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#EB483B] transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
