import type { Article, TrendingTopic, VideoStory } from '../types/news';

const getAPIBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Development: construct URL based on current host
  const hostname = window.location.hostname;
  const port = 5000;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = getAPIBaseURL();

export interface PaginatedArticles {
    articles: Article[];
    total: number;
    page: number;
    totalPages: number;
}

export async function fetchArticles(page?: number, limit?: number): Promise<Article[]> {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    const url = `${API_BASE_URL}/articles${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch articles');
    const data = await response.json();
    // Support both paginated and flat response
    return Array.isArray(data) ? data : data.articles;
}

export async function fetchArticlesPaginated(page: number, limit: number): Promise<PaginatedArticles> {
    const response = await fetch(`${API_BASE_URL}/articles?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    return response.json();
}

export async function searchArticles(q: string): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/articles/search?q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error('Failed to search articles');
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

interface CoinpaprikaTicker {
    id: string;
    name: string;
    symbol: string;
    quotes: {
        USD: {
            price: number;
            percent_change_24h: number;
        };
    };
}

export interface EnhancedMarketData {
    items: MarketItem[];
    timestamp: string;
    baseCurrency: string;
}

// Coinpaprika coin IDs — free, no auth, CORS enabled (public-apis list ✓)
const COINPAPRIKA_IDS: Record<string, string> = {
    BTC:  'btc-bitcoin',
    ETH:  'eth-ethereum',
    BNB:  'bnb-binance-coin',
    SOL:  'sol-solana',
    XRP:  'xrp-xrp',
    ADA:  'ada-cardano',
    DOGE: 'doge-dogecoin',
    AVAX: 'avax-avalanche',
    DOT:  'dot-polkadot',
    MATIC:'matic-polygon',
};


// Major forex symbols to display (subset of the ~170 fawazahmed0 supports)
const FOREX_SYMBOLS = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR',
    'PKR', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'MXN', 'BRL', 'ZAR', 'TRY',
    'AED', 'SAR', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'PLN', 'CZK', 'HUF',
];

export async function fetchMarketData(baseCurrency: string = 'USD'): Promise<MarketItem[]> {
    try {
        // fawazahmed0 currency-api: base=usd returns { date, usd: { aud: 1.56, pkr: 305, eur: 0.917, ... } }
        // All values = "how many of that currency per 1 USD"
        // Step 1: fetch @latest first to get its actual date, then fetch the day before that.
        // (Fetching @{yesterday} often returns the same file as @latest since the CDN
        //  updates at EOD — using latestDate-1 guarantees a genuinely different snapshot.)
        const todayData = await fetch(
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
        ).then(r => r.json());

        const latestDate: string = todayData.date ?? new Date().toISOString().split('T')[0];
        const prevDateObj = new Date(latestDate);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        const prevDateStr = prevDateObj.toISOString().split('T')[0];

        // Fetch yesterday forex + all Coinpaprika tickers in parallel
        const coinpaprikaPromises = Object.values(COINPAPRIKA_IDS).map(id =>
            fetch(`https://api.coinpaprika.com/v1/tickers/${id}?quotes=USD`)
                .then(r => r.json()).catch(() => null)
        );

        const [yesterdayData, ...cryptoResults] = await Promise.all([
            fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${prevDateStr}/v1/currencies/usd.json`)
                .then(r => r.json()).catch(() => ({ usd: {} })),
            ...coinpaprikaPromises,
        ]);

        const cryptoData = cryptoResults.filter((c): c is CoinpaprikaTicker => c !== null && c.quotes?.USD?.price != null);

        const todayRates = todayData?.usd as Record<string, number>;
        const yesterdayRates = (yesterdayData?.usd ?? {}) as Record<string, number>;

        if (!todayRates) return [];

        const baseKey = baseCurrency.toLowerCase();

        // basePerUsd = how many BASE per 1 USD
        // rate(X / BASE) = basePerUsd / xPerUsd  ← correct cross-rate formula
        // e.g. AUD/PKR = (pkr per usd) / (aud per usd) = 305 / 1.56 = 195.5 ✓
        const basePerUsd  = baseCurrency === 'USD' ? 1 : (todayRates[baseKey] ?? 1);
        const basePrevUsd = baseCurrency === 'USD' ? 1 : (yesterdayRates[baseKey] ?? basePerUsd);

        const markets: MarketItem[] = [];

        // Forex
        FOREX_SYMBOLS.forEach(sym => {
            if (sym === baseCurrency) return;
            const symKey = sym.toLowerCase();
            const xPerUsd  = sym === 'USD' ? 1 : (todayRates[symKey] ?? 0);
            const xPrevUsd = sym === 'USD' ? 1 : (yesterdayRates[symKey] ?? xPerUsd);
            if (!xPerUsd) return;

            const todayRate = basePerUsd / xPerUsd;
            const prevRate  = basePrevUsd / xPrevUsd;
            const changePct = prevRate !== 0 ? ((todayRate - prevRate) / prevRate) * 100 : 0;

            markets.push({
                symbol: `${sym}/${baseCurrency}`,
                name: sym,
                value: todayRate,
                change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
                isUp: changePct >= 0,
                category: 'Forex',
            });
        });

        // Crypto — Coinpaprika prices are in USD, convert using basePerUsd
        cryptoData.forEach((coin: CoinpaprikaTicker) => {
            const usdPrice = coin.quotes.USD.price;
            const change24h = coin.quotes.USD.percent_change_24h ?? 0;
            markets.push({
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                value: usdPrice * basePerUsd,
                change: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
                isUp: change24h >= 0,
                category: 'Crypto',
            });
        });

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

export interface LineData {
    time: string;
    value: number;
}

export async function fetchHistoricalLineData(symbol: string, baseCurrency: string = 'USD'): Promise<LineData[]> {
    try {
        if (symbol.includes('/')) {
            // Forex: fawazahmed0 weekly snapshots — works for ALL pairs including PKR, AED, SAR, USD/PKR
            const dates: string[] = [];
            const cursor = new Date();
            cursor.setMonth(cursor.getMonth() - 6);
            const end = new Date();
            while (cursor <= end) {
                dates.push(cursor.toISOString().split('T')[0]);
                cursor.setDate(cursor.getDate() + 7); // weekly intervals (~26 points)
            }

            const targetKey = symbol.split('/')[0].toLowerCase();
            const baseKey = baseCurrency.toLowerCase();

            // Fetch all weekly snapshots in parallel from CDN (fast static files)
            const snapshots = await Promise.all(
                dates.map(date =>
                    fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`)
                        .then(r => r.json())
                        .catch(() => null)
                )
            );

            return snapshots
                .map((data, i) => {
                    if (!data?.usd) return null;
                    const rates = data.usd as Record<string, number>;
                    const basePerUsd = baseKey === 'usd' ? 1 : (rates[baseKey] ?? 0);
                    const xPerUsd    = targetKey === 'usd' ? 1 : (rates[targetKey] ?? 0);
                    if (!basePerUsd || !xPerUsd) return null;
                    return { time: dates[i], value: basePerUsd / xPerUsd };
                })
                .filter((d): d is LineData => d !== null);
        } else {
            // Crypto: Coinpaprika historical — real daily close prices (CORS enabled)
            const coinId = COINPAPRIKA_IDS[symbol.toUpperCase()];
            if (!coinId) return [];

            let multiplier = 1;
            if (baseCurrency !== 'USD') {
                try {
                    const fxData = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json').then(r => r.json());
                    multiplier = fxData?.usd?.[baseCurrency.toLowerCase()] ?? 1;
                } catch { /* keep multiplier = 1 */ }
            }

            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 6);
            const startStr = startDate.toISOString().split('T')[0];

            // Coinpaprika historical: [{ timestamp, price, ... }]
            const response = await fetch(
                `https://api.coinpaprika.com/v1/tickers/${coinId}/historical?start=${startStr}&interval=1d`
            );
            if (!response.ok) return [];
            const rows: { timestamp: string; price: number }[] = await response.json();

            return rows
                .filter(r => r.price != null)
                .map(r => ({
                    time: r.timestamp.split('T')[0],
                    value: r.price * multiplier,
                }));
        }
    } catch (error) {
        console.error('Error fetching historical line data:', error);
        return [];
    }
}
