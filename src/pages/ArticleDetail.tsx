import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, User, ArrowLeft, Share2, Facebook, Twitter,
  Bookmark, MessageCircle, ThumbsUp, Sparkles,
  ChevronDown, ChevronUp, Verified, Globe, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNews } from '@/context/NewsContextCore';
import { CommentSection } from '@/components/CommentSection';
import { StickyShareSidebar } from '@/components/StickyShareSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useRef, useEffect } from 'react';

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticleById, articles, isAdmin, deleteArticle, categoryColors } = useNews();
  const [showSummary, setShowSummary] = useState(false);
  const [showAuthorCard, setShowAuthorCard] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const loadNextRef = useRef<HTMLDivElement>(null);

  const article = getArticleById(id || '');

  // Get related articles (same category, excluding current)
  const relatedArticles = articles
    .filter(a => a.category === article?.category && a.id !== id)
    .slice(0, 3);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingNext && relatedArticles.length > 0) {
        setIsLoadingNext(true);
        setTimeout(() => {
          navigate(`/article/${relatedArticles[0].id}`);
          window.scrollTo(0, 0);
          setIsLoadingNext(false);
        }, 1500);
      }
    }, { threshold: 0.1 });

    if (loadNextRef.current) observer.observe(loadNextRef.current);
    return () => observer.disconnect();
  }, [id, relatedArticles, isLoadingNext, navigate]);

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

  return (
    <div className="py-4 sm:py-6 lg:py-8">
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

        {/* Category & Title */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-[#EB483B]">
            {article.category}
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1a1a1a] dark:text-zinc-100 mb-6 leading-tight tracking-tight reveal-up">
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
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h5 className="font-bold dark:text-zinc-100">{article.author}</h5>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Senior Editor</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-zinc-400 mb-3 leading-relaxed">
                  Covering global news and investigative storytelling for FMN News since 2018.
                </p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  <Globe size={14} className="hover:text-[#EB483B] cursor-pointer" />
                  <Twitter size={14} className="hover:text-blue-400 cursor-pointer" />
                  <Mail size={14} className="hover:text-green-500 cursor-pointer" />
                </div>
              </div>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {article.time}
          </span>
          {article.readTime && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {article.readTime}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {article.comments?.length || 0} comments
          </span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 mb-6 sm:mb-8 reveal-up delay-400">
        <div className="rounded-lg lg:rounded-xl overflow-hidden shadow-2xl">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-[250px] sm:h-[350px] lg:h-[450px] object-cover"
          />
        </div>
      </div>

      <StickyShareSidebar url={window.location.href} title={article.title} />

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

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-4 reveal-up delay-600">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="article-lead-in">
            {article.excerpt}
          </p>
          <div className="text-gray-800 dark:text-zinc-300 text-lg leading-relaxed whitespace-pre-line font-body pt-6 border-t border-gray-100 dark:border-zinc-800 article-drop-cap">
            {article.content}
          </div>
        </div>

        {/* Share & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 font-accent">Share:</span>
            <button className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#1877f2] hover:text-white transition-colors" aria-label="Share on Facebook">
              <Facebook size={14} />
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#1da1f2] hover:text-white transition-colors" aria-label="Share on Twitter">
              <Twitter size={14} />
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full flex items-center justify-center hover:bg-[#e53935] hover:text-white transition-colors" aria-label="Share story">
              <Share2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider">
              <ThumbsUp size={14} />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Bookmark size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection
          articleId={article.id}
          comments={article.comments}
        />
      </div>

      {/* Read Next (Infinite Scroll Trigger) */}
      <div ref={loadNextRef} className="max-w-3xl mx-auto px-4 py-20 text-center">
        {relatedArticles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 text-gray-400">
              <div className="h-px w-12 bg-gray-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Next up</span>
              <div className="h-px w-12 bg-gray-200" />
            </div>

            <div className={`transition-all duration-700 ${isLoadingNext ? 'opacity-50 blur-sm scale-95' : 'opacity-100'}`}>
              <h3 className="text-xl sm:text-2xl font-display font-bold dark:text-zinc-100 mb-4">
                {relatedArticles[0].title}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-[#EB483B] ${isLoadingNext ? 'animate-ping' : ''}`} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {isLoadingNext ? 'Loading Story...' : 'Keep scrolling to read'}
                </span>
              </div>
            </div>
          </div>
        )}
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
