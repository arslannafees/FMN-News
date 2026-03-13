import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Globe, Twitter, Mail, ArrowLeft, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNews } from '@/context/NewsContextCore';
import type { Author, Article } from '@/types/news';
import { timeAgo } from '@/utils/timeAgo';

interface AuthorWithArticles extends Author {
  articles: Article[];
}

export function AuthorProfile() {
  const { id } = useParams<{ id: string }>();
  const { categoryColors } = useNews();
  const [author, setAuthor] = useState<AuthorWithArticles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
    fetch(`${apiBase}/authors/${id}`)
      .then(r => r.json())
      .then(setAuthor)
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="font-display text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-4">Author Not Found</h1>
        <Link to="/" className="text-[#EB483B] hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <title>{author.name} – FMN News Author</title>
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#EB483B] mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Author Card */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12 p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
            {author.avatar
              ? <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              : <User size={36} className="text-gray-400" />
            }
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-1">{author.name}</h1>
            {author.title && <p className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] mb-3">{author.title}</p>}
            {author.bio && <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">{author.bio}</p>}
            <div className="flex items-center gap-4">
              {author.website && <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#EB483B] transition-colors"><Globe size={18} /></a>}
              {author.twitter && <a href={author.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors"><Twitter size={18} /></a>}
              {author.email && <a href={`mailto:${author.email}`} className="text-gray-400 hover:text-green-500 transition-colors"><Mail size={18} /></a>}
            </div>
          </div>
        </div>

        {/* Articles */}
        <h2 className="font-display text-xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6">
          Articles by {author.name} <span className="text-gray-400 font-normal text-base">({author.articles?.length ?? 0})</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {(author.articles || []).map(article => (
            <Link key={article.id} to={`/article/${article.id}`}>
              <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                <div className="h-40 overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-500'}`}>
                    {article.category}
                  </span>
                  <h3 className="font-display text-sm font-bold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#EB483B] transition-colors line-clamp-2 mt-2 mb-2">
                    {article.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {timeAgo(article.createdAt, article.time)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
