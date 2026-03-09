import { Facebook, Twitter, Link2, ThumbsUp, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StickyShareSidebarProps {
    url: string;
    title: string;
}

export function StickyShareSidebar({ url, title }: StickyShareSidebarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show sidebar after scoring past the article header area
            setIsVisible(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const shareLinks = [
        { name: 'Facebook', icon: Facebook, color: 'hover:bg-[#1877f2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
        { name: 'Twitter', icon: Twitter, color: 'hover:bg-[#1da1f2]', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
        {
            name: 'Copy Link', icon: Link2, color: 'hover:bg-gray-800', action: () => {
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        },
    ];

    return (
        <div className={`fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 transition-all duration-500 hidden xl:flex ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
            <div className="flex flex-col items-center gap-6 py-8 px-4 glass rounded-full shadow-2xl border border-white/20 dark:border-white/10">
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-zinc-800 group-hover:bg-[#EB483B] group-hover:text-white">
                        <ThumbsUp size={18} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">Like</span>
                </div>

                <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-700"></div>

                {shareLinks.map((link) => (
                    <button
                        key={link.name}
                        onClick={() => link.action ? link.action() : window.open(link.url, '_blank')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 ${link.color} hover:text-white group relative`}
                        title={link.name}
                    >
                        <link.icon size={18} />
                    </button>
                ))}

                <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-700"></div>

                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-zinc-800 group-hover:bg-[#EB483B] group-hover:text-white">
                        <Bookmark size={18} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">Save</span>
                </div>
            </div>
        </div>
    );
}
