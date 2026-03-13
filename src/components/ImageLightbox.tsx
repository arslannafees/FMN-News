import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  onClose: () => void;
}

function LightboxOverlay({ src, alt, caption, credit, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>
      <div
        className="max-w-6xl w-full flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        {(caption || credit) && (
          <div className="mt-3 text-center max-w-2xl px-4">
            {caption && <p className="text-white/80 text-sm">{caption}</p>}
            {credit && <p className="text-white/50 text-xs mt-1">Photo: {credit}</p>}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ImageLightboxProps2 {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  className?: string;
  imgClassName?: string;
}

export function ImageLightbox({ src, alt, caption, credit, className, imgClassName }: ImageLightboxProps2) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`relative group cursor-zoom-in ${className || ''}`} onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className={imgClassName || 'w-full h-full object-cover'} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
            <ZoomIn size={20} className="text-white" />
          </div>
        </div>
      </div>
      {(caption || credit) && (
        <div className="mt-1.5 flex items-start justify-between gap-2">
          {caption && <p className="text-xs text-gray-500 dark:text-zinc-500 italic flex-1">{caption}</p>}
          {credit && <p className="text-[10px] text-gray-400 dark:text-zinc-600 shrink-0 font-medium">Photo: {credit}</p>}
        </div>
      )}
      {open && (
        <LightboxOverlay src={src} alt={alt} caption={caption} credit={credit} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
