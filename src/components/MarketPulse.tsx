import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMarketData, type MarketItem } from '../services/newsService';

export function MarketPulse() {
    const [markets, setMarkets] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMarkets = async () => {
            try {
                const preference = localStorage.getItem('market_base_currency') || 'USD';
                const data = await fetchMarketData(preference);
                setMarkets(data);
            } catch (error) {
                console.error('Failed to fetch market data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMarkets();
        const interval = setInterval(loadMarkets, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && markets.length === 0) {
        return (
            <div className="h-10 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 overflow-hidden">
                <div className="flex gap-8 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Link to="/market" className="block bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center h-10 overflow-hidden relative group cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-8 px-4 whitespace-nowrap animate-ticker group-hover:pause-ticker">
                {[...markets, ...markets].map((market, idx) => (
                    <div key={`${market.symbol}-${idx}`} className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400">
                            {market.name || market.symbol}
                        </span>
                        <span className="text-[11px] font-bold dark:text-zinc-100">
                            {market.value.toLocaleString(undefined, {
                                minimumFractionDigits: market.value < 10 ? 3 : 2,
                                maximumFractionDigits: market.value < 10 ? 3 : 2
                            })}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${market.isUp ? 'text-green-600' : 'text-red-500'}`}>
                            {market.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {market.change}
                        </span>
                    </div>
                ))}
            </div>

            {/* Dynamic Overlay Shadow for scroll effect */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-zinc-900 to-transparent z-10"></div>
        </Link>
    );
}
