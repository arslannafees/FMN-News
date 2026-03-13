import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Clock, User, ArrowLeft, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { calculateReadingTime } from '@/utils/readingTime';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNews } from '@/context/NewsContextCore';
import { searchArticles } from '@/services/newsService';
import type { Article } from '@/types/news';
import { timeAgo } from '@/utils/timeAgo';

const ARTICLE_TYPES = ['News', 'Analysis', 'Opinion', 'Explainer', 'Fact Check', 'Feature', 'Exclusive', 'In Depth', 'Investigation'];

const DATE_RANGES = [
  { label: 'Any time', value: '' },
  { label: 'Today', value: '1' },
  { label: 'Past week', value: '7' },
  { label: 'Past month', value: '30' },
  { label: 'Past 3 months', value: '90' },
  { label: 'Past year', value: '365' },
];

export function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { categoryColors, config } = useNews();
    const [results, setResults] = useState<Article[]>([]);
    const [searching, setSearching] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        searchArticles(query)
            .then(setResults)
            .catch(() => setResults([]))
            .finally(() => setSearching(false));
    }, [query]);

    // Derive unique authors from results for the author filter
    const authors = useMemo(() => {
        const set = new Set(results.map(a => a.author));
        return Array.from(set).sort();
    }, [results]);

    const activeFilterCount = [filterCategory, filterType, filterDate, filterAuthor].filter(Boolean).length;

    // Apply filters client-side
    const filtered = useMemo(() => {
        let out = results;
        if (filterCategory) out = out.filter(a => a.category === filterCategory);
        if (filterType) out = out.filter(a => a.articleType === filterType);
        if (filterAuthor) out = out.filter(a => a.author === filterAuthor);
        if (filterDate) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(filterDate));
            out = out.filter(a => new Date(a.createdAt) >= cutoff);
        }
        return out;
    }, [results, filterCategory, filterType, filterDate, filterAuthor]);

    const clearFilters = () => {
        setFilterCategory('');
        setFilterType('');
        setFilterDate('');
        setFilterAuthor('');
    };

    return (
        <div className="py-4 sm:py-6 lg:py-8">
            <title>Search: {query} – FMN News</title>
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <Link to="/" className="text-gray-500 hover:text-[#e53935] transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100 flex items-center gap-2">
                            <SearchIcon className="text-[#e53935]" size={24} />
                            Search Results
                        </h1>
                        {query && (
                            <p className="text-gray-500 mt-1 text-sm">
                                {searching ? 'Searching...' : `${filtered.length}${activeFilterCount > 0 ? ` filtered` : ''} result${filtered.length !== 1 ? 's' : ''} for`}{' '}
                                <span className="font-semibold text-[#1a1a1a] dark:text-zinc-200">"{query}"</span>
                                {activeFilterCount > 0 && <span className="text-gray-400"> · {results.length} total</span>}
                            </p>
                        )}
                    </div>
                    {results.length > 0 && (
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-[#e53935] text-white border-[#e53935]' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-[#e53935] hover:text-[#e53935]'}`}
                        >
                            <SlidersHorizontal size={13} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 w-4 h-4 bg-white text-[#e53935] rounded-full text-[9px] font-black flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Filter Panel */}
                {showFilters && results.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Category */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
                                >
                                    <option value="">All Categories</option>
                                    {config.categories.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Article Type */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Type</label>
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
                                >
                                    <option value="">All Types</option>
                                    {ARTICLE_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Date Range</label>
                                <select
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
                                >
                                    {DATE_RANGES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Author */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Author</label>
                                <select
                                    value={filterAuthor}
                                    onChange={e => setFilterAuthor(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
                                >
                                    <option value="">All Authors</option>
                                    {authors.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-gray-500">Active:</span>
                                {filterCategory && <span className="flex items-center gap-1 text-[10px] bg-[#EB483B]/10 text-[#EB483B] px-2 py-0.5 rounded-full font-bold">{filterCategory} <button onClick={() => setFilterCategory('')}><X size={9} /></button></span>}
                                {filterType && <span className="flex items-center gap-1 text-[10px] bg-[#EB483B]/10 text-[#EB483B] px-2 py-0.5 rounded-full font-bold">{filterType} <button onClick={() => setFilterType('')}><X size={9} /></button></span>}
                                {filterDate && <span className="flex items-center gap-1 text-[10px] bg-[#EB483B]/10 text-[#EB483B] px-2 py-0.5 rounded-full font-bold">{DATE_RANGES.find(r => r.value === filterDate)?.label} <button onClick={() => setFilterDate('')}><X size={9} /></button></span>}
                                {filterAuthor && <span className="flex items-center gap-1 text-[10px] bg-[#EB483B]/10 text-[#EB483B] px-2 py-0.5 rounded-full font-bold">{filterAuthor} <button onClick={() => setFilterAuthor('')}><X size={9} /></button></span>}
                                <button onClick={clearFilters} className="text-[10px] text-gray-400 hover:text-gray-600 ml-1 underline">Clear all</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Skeleton while loading */}
                {searching && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-44 w-full rounded-lg" />
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!searching && filtered.length === 0 && (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <SearchIcon size={32} className="text-gray-400" />
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-2 text-center">
                            {query ? (activeFilterCount > 0 ? 'No Filtered Results' : 'No Results Found') : 'Enter a search term'}
                        </h2>
                        <p className="text-gray-600 mb-6 text-center max-w-md">
                            {query
                                ? activeFilterCount > 0
                                    ? `No articles match your filters. Try clearing some filters.`
                                    : `We couldn't find any articles matching "${query}". Try different keywords or check your spelling.`
                                : 'Use the search bar above to look for articles, topics, or authors.'}
                        </p>
                        {activeFilterCount > 0 ? (
                            <Button onClick={clearFilters} className="bg-[#e53935] hover:bg-[#c62828] text-white">
                                Clear Filters
                            </Button>
                        ) : (
                            <Link to="/">
                                <Button className="bg-[#e53935] hover:bg-[#c62828] text-white">
                                    Back to Home
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Article Grid */}
                {!searching && filtered.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filtered.map((article) => (
                            <Link key={article.id} to={`/article/${article.id}`}>
                                <div className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                                    <div className="h-40 sm:h-44 overflow-hidden relative">
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {article.isBreaking && (
                                            <span className="badge-live absolute top-2 left-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" />LIVE
                                            </span>
                                        )}
                                        {article.articleType && article.articleType !== 'News' && (
                                            <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                                                {article.articleType}
                                            </span>
                                        )}
                                        {parseFloat(localStorage.getItem(`fmn_read_${article.id}`) || '0') > 2 && (
                                            <div className="card-read-progress">
                                                <div className="card-read-progress-bar" style={{ width: `${localStorage.getItem(`fmn_read_${article.id}`)}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4 flex flex-col h-full">
                                        <div className="flex-1">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-accent font-semibold mb-2 ${categoryColors[article.category] || 'bg-gray-100 text-gray-800'}`}>
                                                {article.category}
                                            </span>
                                            <h3 className="font-display text-sm sm:text-base font-semibold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#e53935] transition-colors line-clamp-2 mb-2">
                                                {article.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 mb-3">
                                                {article.excerpt}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                                                <User size={10} />
                                                {article.author}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {article.readTime || calculateReadingTime(article.content)}
                                                </span>
                                                <span className="text-[10px] sm:text-xs text-gray-300 dark:text-zinc-600">·</span>
                                                <span className="text-[10px] sm:text-xs text-gray-400">
                                                    {timeAgo(article.createdAt, article.time)}
                                                </span>
                                            </div>
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
