import { Link } from 'react-router-dom';
import { Rss, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useNews } from '@/context/NewsContextCore';

const feedBase = () =>
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : `${window.location.protocol}//${window.location.hostname}:5000`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy URL"
      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} className="text-gray-400" />}
    </button>
  );
}

export function RssFeeds() {
  const { config } = useNews();
  const base = feedBase();

  const mainFeed = { label: 'All Articles', url: `${base}/feed.xml`, desc: 'Every published article across all categories.' };

  const categoryFeeds = config.categories.map(cat => ({
    label: cat.name,
    url: `${base}/feed/${cat.name}.xml`,
    desc: `Latest ${cat.name} articles.`,
    color: cat.color,
  }));

  return (
    <div className="py-8 lg:py-12 px-4">
      <title>RSS Feeds – FMN News</title>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EB483B] rounded-lg flex items-center justify-center shrink-0">
            <Rss size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-[#1a1a1a] dark:text-zinc-100">RSS Feeds</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Subscribe to FMN News in your RSS reader</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-zinc-400 text-sm mb-8 mt-4 leading-relaxed">
          RSS (Really Simple Syndication) lets you follow FMN News in any compatible reader — Feedly, Inoreader, NetNewsWire, or your browser. Copy a feed URL and paste it into your reader.
        </p>

        {/* Main feed */}
        <div className="mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] mb-3">Main Feed</h2>
          <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-4 flex items-center gap-4">
            <Rss size={22} className="text-[#EB483B] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#1a1a1a] dark:text-zinc-100">{mainFeed.label}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5">{mainFeed.desc}</p>
              <code className="text-[10px] text-gray-400 dark:text-zinc-500 break-all mt-1 block">{mainFeed.url}</code>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <CopyButton text={mainFeed.url} />
              <a
                href={mainFeed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                title="Open feed"
              >
                <ExternalLink size={13} className="text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Category feeds */}
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] mb-3">Category Feeds</h2>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
            {categoryFeeds.map(feed => (
              <div key={feed.label} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${feed.color}`}>{feed.label}</span>
                <code className="text-[10px] text-gray-400 dark:text-zinc-500 flex-1 min-w-0 truncate">{feed.url}</code>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={feed.url} />
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Open feed"
                  >
                    <ExternalLink size={13} className="text-gray-400" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to use */}
        <div className="mt-10 p-5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
          <h2 className="font-display text-base font-bold text-[#1a1a1a] dark:text-zinc-100 mb-3">How to subscribe</h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
            <li className="flex gap-2"><span className="font-black text-[#EB483B] shrink-0">1.</span> Copy the feed URL above using the copy button.</li>
            <li className="flex gap-2"><span className="font-black text-[#EB483B] shrink-0">2.</span> Open your RSS reader (Feedly, Inoreader, NetNewsWire, etc.).</li>
            <li className="flex gap-2"><span className="font-black text-[#EB483B] shrink-0">3.</span> Find "Add feed" or "Subscribe" and paste the URL.</li>
            <li className="flex gap-2"><span className="font-black text-[#EB483B] shrink-0">4.</span> New articles will appear automatically in your reader.</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-[#EB483B] transition-colors">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}
