import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMarketData, type MarketItem } from '../services/newsService';

// Curated ticker: major forex pairs + top crypto — always USD-based (universal convention)
const TICKER_FOREX  = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'PKR'];
const TICKER_CRYPTO = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB'];

export function MarketPulse() {
    const [markets, setMarkets] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMarkets = async () => {
            try {
                // Always fetch USD base for the ticker (standard market convention)
                const data = await fetchMarketData('USD');

                // Keep only the curated forex + crypto symbols
                const filtered = data.filter(item =>
                    (item.category === 'Forex'  && TICKER_FOREX.some(s => item.symbol.startsWith(s + '/')))  ||
                    (item.category === 'Crypto' && TICKER_CRYPTO.includes(item.symbol))
                );
                setMarkets(filtered);
            } catch (error) {
                console.error('Failed to fetch market data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMarkets();
        const interval = setInterval(loadMarkets, 60000); // refresh every 60s
        return () => clearInterval(interval);
    }, []);

    if (loading && markets.length === 0) {
        return (
            <div className="h-10 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 overflow-hidden">
                <div className="flex gap-8 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Link
            to="/market"
            className="block bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center h-10 overflow-hidden relative group cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
            <div className="flex items-center gap-8 px-4 whitespace-nowrap animate-ticker group-hover:pause-ticker">
                {[...markets, ...markets].map((market, idx) => (
                    <div key={`${market.symbol}-${idx}`} className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-400">
                            {market.symbol}
                        </span>
                        <span className="text-[11px] font-bold dark:text-zinc-100">
                            {(market.value ?? 0).toLocaleString(undefined, {
                                minimumFractionDigits: (market.value ?? 0) < 10 ? 4 : 2,
                                maximumFractionDigits: (market.value ?? 0) < 10 ? 4 : 2,
                            })}
                        </span>
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${market.isUp ? 'text-green-600' : 'text-red-500'}`}>
                            {market.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {market.change}
                        </span>
                    </div>
                ))}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-zinc-900 to-transparent z-10 pointer-events-none" />
        </Link>
    );
}
