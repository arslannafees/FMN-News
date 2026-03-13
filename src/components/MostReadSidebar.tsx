import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';
import type { Article } from '@/types/news';

export function MostReadSidebar() {
    const { articles, categoryColors } = useNews();
    const [mostRead, setMostRead] = useState<Article[]>([]);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
        fetch(`${apiBase}/articles/most-read`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setMostRead(data);
                else setMostRead(articles.slice(0, 5));
            })
            .catch(() => setMostRead(articles.slice(0, 5)));
    }, [articles]);

    const displayList = mostRead.length > 0 ? mostRead : articles.slice(0, 5);

    return (
        <nav aria-label="Most read articles" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-sm overflow-hidden p-7">
            <h2 className="ap-section-header bg-white dark:bg-zinc-900 !border-t-0 !pt-0 mb-5 text-xl tracking-tight">Most Read</h2>
            <div className="flex flex-col gap-1">
                {displayList.map((article, index) => (
                    <Link
                        key={article.id}
                        to={`/article/${article.id}`}
                        className="flex gap-4 p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-300 group border-b border-gray-100 dark:border-zinc-800 last:border-0"
                    >
                        <span className="font-display text-3xl font-black text-gray-200 dark:text-zinc-700 shrink-0 leading-none group-hover:text-[#EB483B]/20 transition-colors">
                            {index + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                            <h3 className="font-display text-sm font-bold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#EB483B] transition-colors line-clamp-2 leading-tight mb-1">
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-500'}`}>
                                    {article.category}
                                </span>
                                {(article.views ?? 0) > 0 && (
                                    <span className="text-[9px] text-gray-400 flex items-center gap-1">
                                        <Eye size={9} />
                                        {(article.views ?? 0).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
