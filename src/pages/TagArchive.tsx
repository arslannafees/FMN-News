import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNews } from '@/context/NewsContextCore';
import { timeAgo } from '@/utils/timeAgo';
import { calculateReadingTime } from '@/utils/readingTime';

export function TagArchive() {
  const { tag } = useParams<{ tag: string }>();
  const { articles, categoryColors } = useNews();

  const taggedArticles = articles.filter(a =>
    (a.tags || []).some(t => t.toLowerCase() === (tag || '').toLowerCase())
  );

  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <title>#{tag} – FMN News</title>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/" className="text-gray-500 hover:text-[#e53935] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100 flex items-center gap-2">
              <Hash className="text-[#e53935]" size={24} />
              {tag}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {taggedArticles.length} article{taggedArticles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {taggedArticles.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center py-12">
            <h2 className="font-display text-xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-2">No articles found</h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-6 text-center">No articles tagged with <strong>#{tag}</strong> yet.</p>
            <Link to="/"><Button className="bg-[#e53935] hover:bg-[#c62828] text-white">Back to Home</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {taggedArticles.map(article => {
              const readPct = parseFloat(localStorage.getItem(`fmn_read_${article.id}`) || '0');
              return (
                <Link key={article.id} to={`/article/${article.id}`}>
                  <div className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full card-hover">
                    <div className="h-40 sm:h-44 overflow-hidden relative img-zoom">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {article.isBreaking && (
                        <span className="badge-live absolute top-2 left-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" />LIVE
                        </span>
                      )}
                      {readPct > 2 && (
                        <div className="card-read-progress">
                          <div className="card-read-progress-bar" style={{ width: `${readPct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-accent font-semibold mb-2 ${categoryColors[article.category] || 'bg-gray-100 text-gray-800'}`}>
                        {article.category}
                      </span>
                      <h3 className="font-display text-sm sm:text-base font-semibold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#e53935] transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                          <User size={10} />
                          {article.author}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {article.readTime || calculateReadingTime(article.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
