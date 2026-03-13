import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, User, Trash2 } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';
import { timeAgo } from '@/utils/timeAgo';
import { calculateReadingTime } from '@/utils/readingTime';

function getSavedIds(): string[] {
  try { return JSON.parse(localStorage.getItem('fmn_saved') || '[]'); } catch { return []; }
}

export function Saved() {
  const { articles, categoryColors } = useNews();
  const [savedIds, setSavedIds] = useState<string[]>(getSavedIds);

  useEffect(() => {
    const handler = () => setSavedIds(getSavedIds());
    window.addEventListener('fmn_saved_change', handler);
    return () => window.removeEventListener('fmn_saved_change', handler);
  }, []);

  const saved = articles.filter(a => savedIds.includes(a.id));

  const remove = (id: string) => {
    const updated = savedIds.filter(s => s !== id);
    localStorage.setItem('fmn_saved', JSON.stringify(updated));
    setSavedIds(updated);
    window.dispatchEvent(new Event('fmn_saved_change'));
  };

  return (
    <div className="py-6 lg:py-10">
      <title>Saved Articles – FMN News</title>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark size={22} className="text-[#EB483B]" />
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-[#1a1a1a] dark:text-zinc-100">Saved Articles</h1>
            <p className="text-xs text-gray-500 mt-0.5">{saved.length} article{saved.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={48} className="text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-gray-400 dark:text-zinc-600 mb-2">No saved articles yet</h2>
            <p className="text-sm text-gray-400 mb-6">Tap the Save button on any article to read it later.</p>
            <Link to="/" className="text-sm font-bold text-[#EB483B] hover:underline">Browse articles →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map(article => (
              <div key={article.id} className="flex gap-4 bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700 group">
                <Link to={`/article/${article.id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/article/${article.id}`}>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 ${categoryColors[article.category] || 'bg-gray-100 text-gray-700'}`}>
                        {article.category}
                      </span>
                      <h3 className="font-display text-sm sm:text-base font-bold text-[#1a1a1a] dark:text-zinc-100 hover:text-[#EB483B] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                    </Link>
                    <button onClick={() => remove(article.id)} className="shrink-0 text-gray-300 hover:text-red-500 transition-colors mt-0.5" title="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><User size={10} /> {article.author}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {article.readTime || calculateReadingTime(article.content)}</span>
                    <span>{timeAgo(article.createdAt, article.time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
