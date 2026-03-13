import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Menu, X, Facebook, Twitter, Instagram, Youtube,
  ChevronRight, Rss, Moon, Sun
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Bell } from 'lucide-react';
import { subscribeToPush, isPushSubscribed } from '@/services/pushService';
import { useNews } from '@/context/NewsContextCore';
import { PageTransition } from './PageTransition';
import { BreakingTicker } from './BreakingTicker';

interface LayoutProps {
  children: React.ReactNode;
}

const IconMap: Record<string, React.ElementType> = {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Rss
};

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [temp, setTemp] = useState<string>('...');
  const [time, setTime] = useState(new Date());
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(() => !localStorage.getItem('fmn_cookie_consent'));
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<{ symbol: string; value: string; up: boolean; raw: number }[]>([]);
  const baseRatesRef = useRef<Record<string, number>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const { breakingNews, config, trendingTopics, logout, isAdmin, articles } = useNews();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPage = location.pathname.startsWith('/admin');
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Auto-logout when user navigates away from admin pages
  useEffect(() => {
    if (isAdmin && !location.pathname.startsWith('/admin')) {
      logout();
    }
  }, [location.pathname, isAdmin, logout]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setShowBackToTop(window.scrollY > 500);

      // Reading progress — update DOM directly to avoid re-renders
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress}%`;
      }

    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const city = config.site.location.split(',')[0].trim();
        // 1. Get coordinates for the city
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          // 2. Get current weather
          const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
          const weatherData = await weatherResponse.json();
          const temperature = Math.round(weatherData.current.temperature_2m);
          setTemp(`${temperature}°C`);
        } else {
          setTemp('15°C'); // Better fallback based on current Islamabad weather
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setTemp('15°C'); // Fallback
      }
    };
    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 1800000); // Update every 30 mins
    return () => clearInterval(weatherTimer);
  }, [config.site.location]);

  // Currency rates — real data from open.er-api.com (updates hourly), micro-tick every 5s for live feel
  useEffect(() => {
    const buildRates = (r: Record<string, number>, prev?: typeof currencyRates) => {
      const pairs = [
        { symbol: 'EUR/USD', raw: 1 / r.EUR, decimals: 4 },
        { symbol: 'GBP/USD', raw: 1 / r.GBP, decimals: 4 },
        { symbol: 'USD/JPY', raw: r.JPY,      decimals: 2 },
        { symbol: 'USD/CHF', raw: r.CHF,      decimals: 4 },
      ];
      return pairs.map(p => {
        const prevRaw = prev?.find(x => x.symbol === p.symbol)?.raw ?? p.raw;
        const up = p.raw >= prevRaw;
        return { symbol: p.symbol, value: p.raw.toFixed(p.decimals), up, raw: p.raw };
      });
    };

    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.rates) {
          baseRatesRef.current = data.rates;
          setCurrencyRates(prev => buildRates(data.rates, prev));
        }
      } catch { /* silent fail */ }
    };

    // Micro-fluctuation tick — ±0.03% every 5s to simulate live movement
    const tick = () => {
      const base = baseRatesRef.current;
      if (!Object.keys(base).length) return;
      const jittered: Record<string, number> = {};
      ['EUR', 'GBP', 'JPY', 'CHF'].forEach(k => {
        if (base[k]) jittered[k] = base[k] * (1 + (Math.random() - 0.5) * 0.0006);
      });
      setCurrencyRates(prev => buildRates(jittered, prev));
    };

    fetchRates();
    const fetchTimer = setInterval(fetchRates, 3_600_000); // re-fetch real data every hour
    const tickTimer = setInterval(tick, 5_000);            // animate every 5s
    return () => { clearInterval(fetchTimer); clearInterval(tickTimer); };
  }, []);

  // Check push subscription status after 3 seconds
  useEffect(() => {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey || !('serviceWorker' in navigator)) return;
    const alreadyDismissed = localStorage.getItem('fmn_push_dismissed');
    if (alreadyDismissed) return;
    const timer = setTimeout(async () => {
      const subscribed = await isPushSubscribed();
      if (!subscribed) setShowPushBanner(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const currentDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-foreground transition-colors duration-300">
      {/* Reading Progress Bar */}
      <div className="reading-progress-container">
        <div
          ref={progressBarRef}
          className="reading-progress-bar"
        />
      </div>

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1a1a1a] text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl border-t border-white/10">
          <p className="text-xs text-gray-300 text-center sm:text-left max-w-2xl">
            We use cookies to improve your experience. By continuing to use this site, you agree to our{' '}
            <a href="/privacy" className="text-[#EB483B] hover:underline">Privacy Policy</a>.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { localStorage.setItem('fmn_cookie_consent', '1'); setShowCookieBanner(false); }}
              className="text-xs font-bold bg-[#EB483B] text-white px-4 py-2 rounded-full hover:bg-[#c62828] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => { localStorage.setItem('fmn_cookie_consent', 'declined'); setShowCookieBanner(false); }}
              className="text-xs text-gray-400 hover:text-white px-3 py-2 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Floating Back to Top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[#EB483B] hover:bg-[#c62828] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 animate-in slide-in-from-bottom-4"
          aria-label="Back to top"
        >
          <ChevronRight size={18} className="rotate-[-90deg]" />
        </button>
      )}

      {/* Push Notification Banner */}
      {showPushBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-[#1a1a1a] text-white rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 bg-[#EB483B] rounded-full flex items-center justify-center shrink-0">
            <Bell size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-0.5">Enable Notifications</p>
            <p className="text-[10px] text-gray-400">Get breaking news alerts instantly.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={async () => {
                  const ok = await subscribeToPush();
                  if (ok) { setShowPushBanner(false); localStorage.setItem('fmn_push_dismissed', '1'); }
                }}
                className="text-[10px] font-bold bg-[#EB483B] text-white px-3 py-1 rounded-full hover:bg-[#c62828] transition-colors"
              >
                Allow
              </button>
              <button
                onClick={() => { setShowPushBanner(false); localStorage.setItem('fmn_push_dismissed', '1'); }}
                className="text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={() => { setShowPushBanner(false); localStorage.setItem('fmn_push_dismissed', '1'); }} className="text-gray-400 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      {!isAdminPage && <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md shadow-black/5' : ''}`}>
        {/* Main Header */}
        <div className="bg-black dark:bg-zinc-900 text-white transition-colors duration-300 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <span className="font-display text-2xl lg:text-3xl font-black tracking-tighter">
                  <span className="text-[#EB483B]">{config.site.name}</span>
                  <span className="text-white ml-2 uppercase text-xl lg:text-2xl">{config.site.tagline}</span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
                {config.navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`font-body text-xs font-black uppercase tracking-widest transition-colors hover:text-[#EB483B] ${isActive(item.path) ? 'text-[#EB483B]' : 'text-white'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Weather & Time (Integrated) */}
                <div className="hidden xl:flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-gray-400 mr-4">
                  <span>{currentDate}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span>{temp}</span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-white"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Search */}
                <div className="relative">
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-white"
                    aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                  >
                    {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                  </button>
                  {isSearchOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[min(16rem,calc(100vw-2rem))] sm:w-72 bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-2 animate-in fade-in slide-in-from-top-2 z-50">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                          setIsSearchOpen(false);
                        }
                      }}>
                        <div className="relative flex items-center text-black dark:text-white">
                          <Input
                            type="text"
                            placeholder="Search news..."
                            className="w-full pr-8 dark:bg-zinc-800 dark:border-zinc-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="absolute right-2 text-gray-400 hover:text-[#EB483B]"
                            disabled={!searchQuery.trim()}
                            aria-label="Search"
                          >
                            <Search size={16} />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>


                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-white"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Ticker */}
        {currencyRates.length > 0 && (
          <div className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 overflow-x-auto scrollbar-hide transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-7 gap-6 whitespace-nowrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 shrink-0 border-r pr-4 border-gray-200 dark:border-zinc-700 h-full flex items-center">Markets</span>
              <div className="flex items-center gap-5">
                {currencyRates.map(r => (
                  <span key={r.symbol} className="flex items-center gap-1.5 text-[9px] font-bold tabular-nums transition-colors duration-500">
                    <span className="text-gray-400 dark:text-zinc-600 uppercase tracking-wider">{r.symbol}</span>
                    <span className={r.up ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>{r.value}</span>
                    <span className={`text-[8px] leading-none ${r.up ? 'text-green-500' : 'text-red-500'}`}>{r.up ? '▲' : '▼'}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trending Topics Bar (Secondary Nav) */}
        <nav aria-label="Trending topics" className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 flex items-center h-10 gap-6 whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] shrink-0 border-r pr-4 border-gray-200 h-full flex items-center">
              <span className="hidden sm:inline">Trending Topics</span>
              <span className="sm:hidden">Trending</span>
            </span>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-zinc-400">
              {config.navigation
                .filter(item => !['Home', 'World', 'Politics', 'Business', 'Sports', 'Entertainment'].includes(item.name))
                .slice(0, 3)
                .map((item) => (
                  <a key={item.name} href="#" className="hover:text-[#EB483B] flex items-center gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/search?q=${encodeURIComponent(item.name)}`);
                    }}
                  >
                    {item.name}
                  </a>
                ))}
              {/* Add dynamic trending topics from context */}
              {trendingTopics.slice(0, 3).map((topic) => (
                <a
                  key={topic.id}
                  href="#"
                  className="hover:text-[#EB483B]"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/search?q=${encodeURIComponent(topic.tag.replace('#', ''))}`);
                  }}
                >
                  {topic.tag}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden bg-white dark:bg-zinc-950 border-t dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {config.navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`font-body text-xs font-black uppercase tracking-widest py-3 px-2 rounded-lg transition-colors ${isActive(item.path)
                    ? 'text-[#EB483B] bg-red-50 dark:bg-red-950/20'
                    : 'text-[#1a1a1a] dark:text-zinc-100 hover:text-[#EB483B] hover:bg-gray-50 dark:hover:bg-zinc-900'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>}

      {/* Breaking News Ticker */}
      {!isAdminPage && <BreakingTicker news={breakingNews} />}

      {/* Main Content */}
      <main>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Footer */}
      {!isAdminPage && <footer className="bg-[#1a1a1a] dark:bg-black text-white py-10 lg:py-12 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-2 lg:col-span-1">
              <Link to="/" className="inline-block mb-4">
                <span className="font-display text-xl lg:text-2xl font-black tracking-tighter">
                  <span className="text-[#EB483B]">{config.site.name}</span>
                  <span className="text-white ml-2 uppercase text-lg lg:text-xl">{config.site.tagline}</span>
                </span>
              </Link>
              <p className="text-gray-400 text-sm mb-4">
                {config.site.description}
              </p>
              <div className="flex items-center gap-2">
                {config.socialLinks.map((link) => {
                  const Icon = IconMap[link.icon];
                  return (
                    <a key={link.platform} href={link.url} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#e53935] transition-colors" aria-label={`Follow us on ${link.platform}`}>
                      {Icon && <Icon size={14} />}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-body font-black uppercase tracking-widest text-xs mb-4 text-[#EB483B]">Company</h4>
              <ul className="space-y-2">
                {config.footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.url} className="text-gray-400 text-sm hover:text-[#e53935] transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-body font-black uppercase tracking-widest text-xs mb-4 text-[#EB483B]">Categories</h4>
              <ul className="space-y-2">
                {config.categories.filter(c => !['Science', 'Health'].includes(c.name)).map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/category/${item.name.toLowerCase()}`}
                      className="text-gray-400 text-sm hover:text-[#e53935] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-body font-black uppercase tracking-widest text-xs mb-4 text-[#EB483B]">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>{config.site.location}</li>
                <li>{config.site.email}</li>
                <li>{config.site.phone}</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © {new Date().getFullYear()} FMN News. All rights reserved.
            </p>
            <Link
              to="/rss"
              className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-[#EB483B] transition-colors"
              aria-label="RSS Feeds"
            >
              <Rss size={13} />
              RSS Feeds
            </Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-10 h-10 bg-[#EB483B] rounded-sm flex items-center justify-center hover:bg-[#c62828] transition-colors"
              aria-label="Back to top"
            >
              <ChevronRight size={20} className="rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </footer>}
    </div>
  );
}
