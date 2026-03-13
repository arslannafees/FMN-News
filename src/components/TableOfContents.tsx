import { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import { extractHeadings, type Heading } from '@/utils/contentRenderer';

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeSlug, setActiveSlug] = useState<string>('');
  const headings = extractHeadings(content);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );

    headings.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [content]);

  if (headings.length < 2) return null;

  const scrollTo = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-24 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <List size={14} className="text-[#EB483B]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Contents</span>
      </div>
      <ul className="space-y-1">
        {headings.map((heading: Heading) => (
          <li key={heading.slug}>
            <button
              onClick={() => scrollTo(heading.slug)}
              className={`w-full text-left text-xs leading-relaxed py-1 px-2 rounded-lg transition-all ${
                heading.level === 3 ? 'pl-5' : ''
              } ${
                activeSlug === heading.slug
                  ? 'text-[#EB483B] font-bold bg-[#EB483B]/5'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-[#EB483B] hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
