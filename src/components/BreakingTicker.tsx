import { useState, useEffect, useRef } from 'react';

const TICKER_SPEED_DESKTOP = 80; // px/s on ≥640px screens
const TICKER_SPEED_MOBILE  = 50; // px/s on  <640px screens

export function BreakingTicker({ news }: { news: string[] }) {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    const calc = () => {
      // scrollWidth is the full doubled content; half that is the actual loop distance
      const halfWidth = el.scrollWidth / 2;
      const isMobile = window.innerWidth < 640;
      const speed = isMobile ? TICKER_SPEED_MOBILE : TICKER_SPEED_DESKTOP;
      setDuration(Math.round(halfWidth / speed));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [news]);

  return (
    <div className="bg-gradient-to-r from-[#e53935] to-[#c62828] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="bg-[#1a1a1a] px-2.5 lg:px-4 py-2 lg:py-3 font-accent font-bold text-[10px] lg:text-sm flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 bg-white rounded-full pulse-dot shrink-0"></span>
          BREAKING
        </div>
        <div className="flex-1 overflow-hidden py-2 lg:py-3">
          <div
            ref={tickerRef}
            style={{ animationDuration: `${duration}s` }}
            className="ticker-animation whitespace-nowrap flex w-max"
          >
            {[...news, ...news].map((item, i) => (
              <div key={i} className="font-accent text-[11px] lg:text-sm flex items-center gap-2 shrink-0 pr-6 lg:pr-12">
                <span>{item}</span>
                <span className="text-white/50">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
