import { useSearchParams, Link } from 'react-router-dom';
import { Clock, User, ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNews } from '@/context/NewsContextCore';

export function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { articles, categoryColors } = useNews();

    // Filter articles based on the search query
    const searchResults = articles.filter(article => {
        if (!query) return false;
        const lowerQuery = query.toLowerCase();

        return (
            article.title.toLowerCase().includes(lowerQuery) ||
            article.excerpt.toLowerCase().includes(lowerQuery) ||
            (article.content && article.content.toLowerCase().includes(lowerQuery)) ||
            article.category.toLowerCase().includes(lowerQuery) ||
            (article.author && article.author.toLowerCase().includes(lowerQuery))
        );
    });

    return (
        <div className="py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <Link to="/" className="text-gray-500 hover:text-[#e53935] transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a] flex items-center gap-2">
                            <SearchIcon className="text-[#e53935]" size={24} />
                            Search Results
                        </h1>
                        {query && (
                            <p className="text-gray-500 mt-1">
                                Showing results for <span className="font-semibold text-[#1a1a1a]">"{query}"</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Empty State */}
                {searchResults.length === 0 && (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <SearchIcon size={32} className="text-gray-400" />
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-2 text-center">
                            {query ? 'No Results Found' : 'Enter a search term'}
                        </h2>
                        <p className="text-gray-600 mb-6 text-center max-w-md">
                            {query
                                ? `We couldn't find any articles matching "${query}". Try different keywords or check your spelling.`
                                : 'Use the search bar above to look for articles, topics, or authors.'}
                        </p>
                        <Link to="/">
                            <Button className="bg-[#e53935] hover:bg-[#c62828] text-white">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Article Grid */}
                {searchResults.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {searchResults.map((article) => (
                            <Link key={article.id} to={`/article/${article.id}`}>
                                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                                    <div className="h-40 sm:h-44 overflow-hidden">
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-3 sm:p-4 flex flex-col h-full">
                                        <div className="flex-1">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-accent font-semibold mb-2 ${categoryColors[article.category] || 'bg-gray-100 text-gray-800'}`}>
                                                {article.category}
                                            </span>
                                            <h3 className="font-display text-sm sm:text-base font-semibold text-[#1a1a1a] group-hover:text-[#e53935] transition-colors line-clamp-2 mb-2">
                                                {article.title}
                                            </h3>
                                            <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                                                {article.excerpt}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                                                <User size={10} />
                                                {article.author}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {article.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
