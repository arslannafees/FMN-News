import { useState } from 'react';

const REACTIONS = [
  { emoji: '👍', label: 'Insightful' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

interface ArticleReactionsProps {
  articleId: string;
}

export function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const storageKey = `fmn_reactions_${articleId}`;
  const myKey = `fmn_myreaction_${articleId}`;

  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const [myReaction, setMyReaction] = useState<string | null>(() => localStorage.getItem(myKey));

  const handleReaction = (emoji: string) => {
    setCounts(prev => {
      const next = { ...prev };
      if (myReaction === emoji) {
        next[emoji] = Math.max(0, (next[emoji] || 0) - 1);
        localStorage.removeItem(myKey);
        setMyReaction(null);
      } else {
        if (myReaction) next[myReaction] = Math.max(0, (next[myReaction] || 0) - 1);
        next[emoji] = (next[emoji] || 0) + 1;
        localStorage.setItem(myKey, emoji);
        setMyReaction(emoji);
      }
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-zinc-400 font-accent shrink-0">React:</span>
      {REACTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          title={label}
          className={`reaction-btn${myReaction === emoji ? ' active' : ''}`}
        >
          <span className="text-base leading-none">{emoji}</span>
          {(counts[emoji] || 0) > 0 && (
            <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 leading-none">{counts[emoji]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
