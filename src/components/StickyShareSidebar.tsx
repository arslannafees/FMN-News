import { Facebook, Twitter, Link2, ThumbsUp, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StickyShareSidebarProps {
    url: string;
    title: string;
    articleId: string;
}

export function StickyShareSidebar({ url, title, articleId }: StickyShareSidebarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLiked, setIsLiked] = useState(() => {
        try { return (JSON.parse(localStorage.getItem('fmn_liked') || '[]') as string[]).includes(articleId); } catch { return false; }
    });
    const [isSaved, setIsSaved] = useState(() => {
        try { return (JSON.parse(localStorage.getItem('fmn_saved') || '[]') as string[]).includes(articleId); } catch { return false; }
    });

    useEffect(() => {
        const handleScroll = () => setIsVisible(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Stay in sync if the inline buttons on the page change the values
    useEffect(() => {
        const sync = () => {
            try {
                setIsLiked((JSON.parse(localStorage.getItem('fmn_liked') || '[]') as string[]).includes(articleId));
                setIsSaved((JSON.parse(localStorage.getItem('fmn_saved') || '[]') as string[]).includes(articleId));
            } catch { /* ignore */ }
        };
        window.addEventListener('fmn_saved_change', sync);
        return () => window.removeEventListener('fmn_saved_change', sync);
    }, [articleId]);

    const toggleLike = () => {
        try {
            const liked: string[] = JSON.parse(localStorage.getItem('fmn_liked') || '[]');
            const updated = isLiked ? liked.filter(l => l !== articleId) : [...liked, articleId];
            localStorage.setItem('fmn_liked', JSON.stringify(updated));
            setIsLiked(!isLiked);
        } catch { /* ignore */ }
    };

    const toggleSave = () => {
        try {
            const saved: string[] = JSON.parse(localStorage.getItem('fmn_saved') || '[]');
            const updated = isSaved ? saved.filter(s => s !== articleId) : [...saved, articleId];
            localStorage.setItem('fmn_saved', JSON.stringify(updated));
            window.dispatchEvent(new Event('fmn_saved_change'));
            setIsSaved(!isSaved);
        } catch { /* ignore */ }
    };

    const copyLink = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).catch(() => {});
        }
    };

    const shareLinks = [
        { name: 'Facebook', icon: Facebook, color: 'hover:bg-[#1877f2]', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
        { name: 'Twitter',  icon: Twitter,  color: 'hover:bg-[#1da1f2]', action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank') },
        { name: 'Copy Link', icon: Link2,   color: 'hover:bg-gray-800',  action: copyLink },
    ];

    return (
        <div className={`fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 transition-all duration-500 hidden xl:flex ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
            <div className="flex flex-col items-center gap-6 py-8 px-4 glass rounded-full shadow-2xl border border-white/20 dark:border-white/10">
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={toggleLike}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-[#EB483B] text-white' : 'bg-gray-100 dark:bg-zinc-800 hover:bg-[#EB483B] hover:text-white'}`}
                        title={isLiked ? 'Unlike' : 'Like'}
                    >
                        <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">Like</span>
                </div>

                <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-700" />

                {shareLinks.map((link) => (
                    <button
                        key={link.name}
                        onClick={link.action}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 ${link.color} hover:text-white`}
                        title={link.name}
                    >
                        <link.icon size={18} />
                    </button>
                ))}

                <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-700" />

                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={toggleSave}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-[#EB483B] text-white' : 'bg-gray-100 dark:bg-zinc-800 hover:bg-[#EB483B] hover:text-white'}`}
                        title={isSaved ? 'Remove from saved' : 'Save for later'}
                    >
                        <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">Save</span>
                </div>
            </div>
        </div>
    );
}
