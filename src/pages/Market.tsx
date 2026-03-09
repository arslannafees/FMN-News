import { useEffect, useState } from 'react';
import { fetchEnhancedMarketData, fetchHistoricalMarketData, type EnhancedMarketData, type OHLCData } from '../services/newsService';
import { CandlestickChart } from '../components/CandlestickChart';
import { ArrowLeftRight, TrendingUp, TrendingDown, Activity, Loader2, ChevronRight, BarChart3, Coins } from 'lucide-react';

const CATEGORIES = ['All', 'Forex', 'Crypto'] as const;
type Category = typeof CATEGORIES[number];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'PKR'] as const;
type BaseCurrency = typeof CURRENCIES[number];

export function Market() {
    const [data, setData] = useState<EnhancedMarketData | null>(null);
    const [historicalData, setHistoricalData] = useState<OHLCData[]>([]);
    const [activeSymbol, setActiveSymbol] = useState<string>('EUR');
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>((localStorage.getItem('market_base_currency') as BaseCurrency) || 'USD');

    const [loadingRates, setLoadingRates] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial rates load
    useEffect(() => {
        const loadRates = async () => {
            try {
                const result = await fetchEnhancedMarketData(baseCurrency);
                setData(result);

                // Set default active if not set
                if (result && result.items.length > 0 && activeSymbol === 'EUR') {
                    // Try to find EUR/USD or similar, else first item
                    const eur = result.items.find(i => i.symbol.includes('EUR'));
                    if (eur) setActiveSymbol(eur.symbol);
                    else setActiveSymbol(result.items[0].symbol);
                }
            } catch (err) {
                setError('Failed to load market data.');
                console.error(err);
            } finally {
                setLoadingRates(false);
            }
        };

        loadRates();
        const interval = setInterval(loadRates, 10000); // 10s refresh for real-time feel
        return () => clearInterval(interval);
    }, [baseCurrency, activeSymbol]);

    // Load historical data whenever activeSymbol or baseCurrency changes
    useEffect(() => {
        if (!activeSymbol) return;

        const loadHistorical = async () => {
            setLoadingChart(true);
            try {
                const history = await fetchHistoricalMarketData(activeSymbol, baseCurrency);
                setHistoricalData(history);
            } catch (err) {
                console.error('Failed to load chart data', err);
            } finally {
                setLoadingChart(false);
            }
        };

        loadHistorical();
    }, [activeSymbol, baseCurrency]);

    if (loadingRates && !data) {
        return (
            <div className="flex justify-center items-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} />
                    <span className="text-gray-500 font-medium">Loading Market Intelligence...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[70vh] gap-4">
                <div className="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-6 py-4 rounded-xl border border-red-200 dark:border-red-800/50">
                    {error}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 font-medium"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!data) return null;

    const filteredItems = activeCategory === 'All'
        ? data.items
        : data.items.filter(i => i.category === activeCategory);

    const activeItem = data.items.find(i => i.symbol === activeSymbol);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Forex': return <ArrowLeftRight size={16} />;
            case 'Crypto': return <Coins size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-[#09090b] min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                                <Activity size={28} />
                            </div>
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Market Center
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mt-2 text-lg">
                            Comprehensive tracking of global forex exchange rates and digital assets.
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        {CURRENCIES.map(curr => (
                            <button
                                key={curr}
                                onClick={() => {
                                    setBaseCurrency(curr);
                                    localStorage.setItem('market_base_currency', curr);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${baseCurrency === curr ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category Selector */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap
                                ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {cat !== 'All' && getCategoryIcon(cat)}
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Chart Detail Dashboard */}
                    <div className="w-full lg:w-2/3 flex flex-col gap-6">
                        {activeItem && (
                            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                                {activeItem.symbol}
                                            </h2>
                                            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-1 rounded text-sm mt-2 flex items-center gap-1">
                                                {getCategoryIcon(activeItem.category)}
                                                {activeItem.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 dark:text-zinc-500 font-medium text-lg">
                                            {activeItem.name}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <div className="text-4xl font-bold tracking-tight text-gray-800 dark:text-zinc-100">
                                            {activeItem.value.toLocaleString(undefined, {
                                                minimumFractionDigits: activeItem.value < 10 ? 4 : 2,
                                                maximumFractionDigits: activeItem.value < 10 ? 4 : 2
                                            })}
                                            <span className="ml-2 text-xl font-bold text-gray-400 dark:text-zinc-600">{baseCurrency}</span>
                                        </div>
                                        <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm ${activeItem.isUp ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                            {activeItem.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {activeItem.change}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-gray-100 dark:border-zinc-900 pt-6 relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-zinc-400 font-medium text-sm text-lg">
                                        <BarChart3 size={20} className="text-blue-500" /> Historical Performance (6 Months)
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#0c0c0e] rounded-xl border border-gray-100 dark:border-zinc-800 p-2 min-h-[400px] flex items-center justify-center relative">
                                        {loadingChart ? (
                                            <Loader2 className="animate-spin text-blue-500" size={32} />
                                        ) : historicalData.length > 0 ? (
                                            <CandlestickChart data={historicalData} />
                                        ) : (
                                            <span className="text-gray-400">No chart data available for this benchmark</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Benchmark List */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col h-full max-h-[850px]">
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-900 sticky top-0 bg-white dark:bg-zinc-950 rounded-t-2xl z-10">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 size={20} className="text-blue-500" />
                                    Market Watchlist
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Showing {filteredItems.length} active benchmarks in {baseCurrency}</p>
                            </div>

                            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                                <div className="flex flex-col gap-1">
                                    {filteredItems.map((item) => (
                                        <button
                                            key={item.symbol}
                                            onClick={() => setActiveSymbol(item.symbol)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group text-left
                                                ${activeSymbol === item.symbol
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30'
                                                    : 'hover:bg-gray-50 dark:hover:bg-zinc-900 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-colors text-[10px]
                                                    ${activeSymbol === item.symbol
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700'
                                                    }`}
                                                >
                                                    {item.symbol.substring(0, 3)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-bold uppercase tracking-tight truncate max-w-[120px] ${activeSymbol === item.symbol ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                                                        {getCategoryIcon(item.category)} {item.symbol}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold text-gray-800 dark:text-zinc-200 text-sm">
                                                        {item.value.toLocaleString(undefined, {
                                                            minimumFractionDigits: item.value < 10 ? 3 : 2,
                                                            maximumFractionDigits: item.value < 10 ? 3 : 2
                                                        })}
                                                    </span>
                                                    <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${item.isUp ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-500'}`}>
                                                        {item.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                        {item.change}
                                                    </span>
                                                </div>
                                                <ChevronRight size={18} className={`transition-transform duration-300 ${activeSymbol === item.symbol ? 'text-blue-500 translate-x-1' : 'text-gray-300 dark:text-zinc-700 group-hover:text-gray-400'}`} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
