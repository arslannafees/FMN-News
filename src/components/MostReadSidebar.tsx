import { Link } from 'react-router-dom';
import { useNews } from '@/context/NewsContextCore';

export function MostReadSidebar() {
    const { articles } = useNews();

    // Mock 'most read' by just taking a few articles
    const mostRead = articles.slice(0, 5);

    return (
        <nav aria-label="Most read articles" className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden p-7">
            <h2 className="ap-section-header bg-white !border-t-0 !pt-0 mb-5 text-xl tracking-tight">Most Read</h2>
            <div className="flex flex-col gap-1">
                {mostRead.map((article, index) => (
                    <Link
                        key={article.id}
                        to={`/article/${article.id}`}
                        className="flex gap-4 p-3 -mx-3 rounded-2xl hover:bg-gray-50 transition-all duration-300 group border-b border-gray-100 last:border-0"
                    >
                        <span className="font-display text-3xl font-black text-gray-200 shrink-0 leading-none group-hover:text-[#EB483B]/20 transition-colors">
                            {index + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                            <h3 className="font-display text-sm font-bold text-[#1a1a1a] group-hover:text-[#EB483B] transition-colors line-clamp-2 leading-tight mb-1">
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {article.category}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
