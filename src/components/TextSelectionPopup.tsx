import { useState, useEffect, useRef } from 'react';
import { Twitter, Copy, Check } from 'lucide-react';

interface TextSelectionPopupProps {
  articleUrl: string;
}

export function TextSelectionPopup({ articleUrl }: TextSelectionPopupProps) {
  const [popup, setPopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node)) return;
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';
      if (text.length < 15) { setPopup(null); return; }
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopup({ text, x: rect.left + rect.width / 2 + window.scrollX, y: rect.top + window.scrollY - 52 });
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setPopup(null);
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!popup) return null;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${popup.text.slice(0, 200)}"`)}&url=${encodeURIComponent(articleUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(popup.text);
    setCopied(true);
    setTimeout(() => { setPopup(null); setCopied(false); }, 1200);
  };

  return (
    <div
      ref={popupRef}
      className="text-selection-popup"
      style={{ left: popup.x, top: popup.y }}
    >
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-[#1da1f2] transition-colors"
        onClick={() => setPopup(null)}
      >
        <Twitter size={11} />
        Tweet
      </a>
      <span className="w-px h-3.5 bg-white/20 shrink-0" />
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-[#EB483B] transition-colors"
      >
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
