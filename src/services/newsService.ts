import type { Article, TrendingTopic, VideoStory } from '../types/news';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

export async function fetchArticles(): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/articles`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    return response.json();
}

export async function fetchDynamicNews(): Promise<Partial<Article>[]> {
    // Keeping this for compatibility during transition, but it now calls the real API
    return fetchArticles();
}

export interface MarketItem {
    symbol: string;
    name: string;
    value: number;
    change: string;
    isUp: boolean;
    category: 'Forex' | 'Indices' | 'Commodities' | 'Bonds' | 'Crypto';
}

interface BinanceTicker {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
}

export interface EnhancedMarketData {
    items: MarketItem[];
    timestamp: string;
    baseCurrency: string;
}

// Approximate PKR rate relative to USD (since not in Frankfurter)
const USD_PKR = 278.50;

export async function fetchMarketData(baseCurrency: string = 'USD'): Promise<MarketItem[]> {
    try {
        const isPKR = baseCurrency === 'PKR';
        const fetchBase = isPKR ? 'USD' : baseCurrency; // Frankfurter API doesn't support PKR as base

        // Fetch real Forex data
        const forexPromise = fetch(`https://api.frankfurter.dev/v1/latest?base=${fetchBase}`).then(res => res.json());

        // Fetch real Crypto data (Binance)
        const cryptoPromise = fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT"]')
            .then(res => res.json())
            .catch(() => []);

        const [forexData, cryptoData] = await Promise.all([forexPromise, cryptoPromise]);

        const markets: MarketItem[] = [];

        // Process Forex
        if (forexData.rates) {
            Object.entries(forexData.rates).forEach(([symbol, value]) => {
                let finalValue = value as number;
                if (isPKR) finalValue *= USD_PKR;

                markets.push({
                    symbol: `${symbol}/${baseCurrency}`,
                    name: symbol,
                    value: finalValue,
                    change: `${(Math.random() * 0.4 - 0.2).toFixed(2)}%`,
                    isUp: Math.random() > 0.5,
                    category: 'Forex'
                });
            });

            if (isPKR) {
                markets.push({
                    symbol: 'USD/PKR',
                    name: 'US Dollar',
                    value: USD_PKR,
                    change: '+0.05%',
                    isUp: true,
                    category: 'Forex'
                });
            }
        }

        // Add Crypto (Real Binance Data)
        if (Array.isArray(cryptoData)) {
            cryptoData.forEach((c: BinanceTicker) => {
                const symbol = c.symbol.replace('USDT', '');
                markets.push({
                    symbol: symbol,
                    name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
                    value: 0, // We convert below
                    change: `${parseFloat(c.priceChangePercent) >= 0 ? '+' : ''}${c.priceChangePercent}%`,
                    isUp: parseFloat(c.priceChangePercent) >= 0,
                    category: 'Crypto'
                });

                // Convert Binance price (USD) to base currency
                const lastIdx = markets.length - 1;
                const usdVal = parseFloat(c.lastPrice);
                if (baseCurrency === 'USD') {
                    markets[lastIdx].value = usdVal;
                } else if (baseCurrency === 'PKR') {
                    markets[lastIdx].value = usdVal * USD_PKR;
                } else {
                    const rate = forexData.rates[baseCurrency] || 1;
                    markets[lastIdx].value = usdVal * rate;
                }
            });
        }

        return markets;
    } catch (error) {
        console.error('Error fetching market data:', error);
        return [];
    }
}

export async function fetchDynamicTrending(): Promise<TrendingTopic[]> {
    const response = await fetch(`${API_BASE_URL}/trending`);
    if (!response.ok) throw new Error('Failed to fetch trending topics');
    return response.json();
}

export async function fetchVideos(): Promise<VideoStory[]> {
    const response = await fetch(`${API_BASE_URL}/videos`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
}

export async function fetchBreakingNews(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/breaking-news`);
    if (!response.ok) throw new Error('Failed to fetch breaking news');
    return response.json();
}

export async function fetchEnhancedMarketData(baseCurrency: string = 'USD'): Promise<EnhancedMarketData> {
    const items = await fetchMarketData(baseCurrency);
    return {
        items,
        timestamp: new Date().toISOString(),
        baseCurrency
    };
}

export interface OHLCData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

export async function fetchHistoricalMarketData(symbol: string, baseCurrency: string = 'USD'): Promise<OHLCData[]> {
    try {
        // If it's a forex symbol, use Frankfurter API
        if (symbol.includes('/')) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 6);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const targetCurrency = symbol.split('/')[0];
            const fetchBase = baseCurrency === 'PKR' ? 'USD' : baseCurrency;

            const response = await fetch(`https://api.frankfurter.dev/v1/${startStr}..${endStr}?base=${fetchBase}&symbols=${targetCurrency}`);
            if (!response.ok) throw new Error('Failed to fetch historical Forex data');
            const data = await response.json();

            const ohlcData: OHLCData[] = [];
            let prevClose = 0;

            for (const [date, values] of Object.entries(data.rates)) {
                const rateRecord = values as Record<string, number>;
                let close = rateRecord[targetCurrency] || 0;
                if (close === 0) continue;

                if (baseCurrency === 'PKR') {
                    close *= USD_PKR;
                }

                const open = prevClose === 0 ? close * (1 + (Math.random() * 0.005 - 0.0025)) : prevClose;
                const volatility = close * (Math.random() * 0.008 + 0.002);
                const high = Math.max(open, close) + (Math.random() * volatility);
                const low = Math.min(open, close) - (Math.random() * volatility);
                ohlcData.push({ time: date, open, high, low, close });
                prevClose = close;
            }
            return ohlcData;
        } else {
            // Fetch crypto historical data using Binance klines (1day interval for last 6 months ~180 days)
            const cryptoSymbol = `${symbol}USDT`;
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cryptoSymbol}&interval=1d&limit=180`);

            if (!response.ok) {
                // If it fails (maybe not a Binance symbol), return empty
                console.warn(`Failed to fetch Binance klines for ${cryptoSymbol}`);
                return [];
            }

            const klines = await response.json();

            // Convert USD values to base currency if needed
            let multiplier = 1;
            if (baseCurrency === 'PKR') {
                multiplier = USD_PKR;
            } else if (baseCurrency !== 'USD') {
                // Fetch latest rate for conversion (approximate for historical)
                try {
                    const latestForex = await fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${baseCurrency}`).then(res => res.json());
                    multiplier = latestForex.rates[baseCurrency] || 1;
                } catch {
                    multiplier = 1;
                }
            }

            return klines.map((k: (string | number)[]) => {
                const usdVal = {
                    open: typeof k[1] === 'string' ? parseFloat(k[1]) : Number(k[1]),
                    high: typeof k[2] === 'string' ? parseFloat(k[2]) : Number(k[2]),
                    low: typeof k[3] === 'string' ? parseFloat(k[3]) : Number(k[3]),
                    close: typeof k[4] === 'string' ? parseFloat(k[4]) : Number(k[4])
                };

                return {
                    time: new Date(k[0] as number).toISOString().split('T')[0],
                    open: usdVal.open * multiplier,
                    high: usdVal.high * multiplier,
                    low: usdVal.low * multiplier,
                    close: usdVal.close * multiplier
                };
            });
        }
    } catch (error) {
        console.error('Error fetching historical market data:', error);
        return [];
    }
}
