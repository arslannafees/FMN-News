import React from 'react';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export interface Heading {
  level: 2 | 3;
  text: string;
  slug: string;
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      headings.push({ level: 3, text: h3[1].trim(), slug: slugify(h3[1].trim()) });
    } else if (h2) {
      headings.push({ level: 2, text: h2[1].trim(), slug: slugify(h2[1].trim()) });
    }
  }
  return headings;
}

function getSocialEmbed(line: string): React.ReactNode | null {
  const trimmed = line.trim();

  // Twitter/X embed
  const twitterMatch = trimmed.match(/^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  if (twitterMatch) {
    const tweetId = twitterMatch[2];
    return (
      <div className="my-4 flex justify-center">
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
          className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-zinc-700"
          style={{ minHeight: 200 }}
          scrolling="no"
          frameBorder="0"
          title={`Tweet ${tweetId}`}
        />
      </div>
    );
  }

  // Instagram embed
  const igMatch = trimmed.match(/^https?:\/\/www\.instagram\.com\/p\/([\w-]+)/);
  if (igMatch) {
    return (
      <div className="my-4 flex justify-center">
        <iframe
          src={`https://www.instagram.com/p/${igMatch[1]}/embed/`}
          className="w-full max-w-md rounded-xl border border-gray-200 dark:border-zinc-700"
          style={{ minHeight: 540 }}
          scrolling="no"
          frameBorder="0"
          title={`Instagram post`}
          allowFullScreen
        />
      </div>
    );
  }

  // YouTube embed
  const ytMatch = trimmed.match(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    const videoId = ytMatch[3];
    return (
      <div className="my-4 relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`YouTube video`}
        />
      </div>
    );
  }

  // Datawrapper chart embed
  const dwMatch = trimmed.match(/^https?:\/\/datawrapper\.dwcdn\.net\/([\w-]+)/);
  if (dwMatch) {
    return (
      <div className="my-6 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-zinc-800">
        <iframe
          src={`https://datawrapper.dwcdn.net/${dwMatch[1]}/1/`}
          className="w-full"
          style={{ minHeight: 420 }}
          scrolling="no"
          frameBorder="0"
          title="Data chart"
          aria-label="Embedded data chart"
        />
      </div>
    );
  }

  // Flourish chart embed
  const flourishMatch = trimmed.match(/^https?:\/\/flo\.uri\.sh\/visualisation\/(\d+)/);
  if (flourishMatch) {
    return (
      <div className="my-6 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-zinc-800">
        <iframe
          src={`https://flo.uri.sh/visualisation/${flourishMatch[1]}/embed`}
          className="w-full"
          style={{ minHeight: 420 }}
          scrolling="no"
          frameBorder="0"
          title="Flourish chart"
          aria-label="Embedded Flourish chart"
          allowFullScreen
        />
      </div>
    );
  }

  return null;
}

export function renderContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const blockquote = line.match(/^>\s+(.+)$/);
    const socialEmbed = getSocialEmbed(line);

    if (socialEmbed) {
      elements.push(<React.Fragment key={key++}>{socialEmbed}</React.Fragment>);
    } else if (blockquote) {
      elements.push(
        <blockquote key={key++} className="article-pullquote">
          {blockquote[1].trim()}
        </blockquote>
      );
    } else if (h3) {
      const text = h3[1].trim();
      const slug = slugify(text);
      elements.push(
        <h3 key={key++} id={slug} className="font-display text-xl font-bold text-[#1a1a1a] dark:text-zinc-100 mt-8 mb-3 scroll-mt-24">
          {text}
        </h3>
      );
    } else if (h2) {
      const text = h2[1].trim();
      const slug = slugify(text);
      elements.push(
        <h2 key={key++} id={slug} className="font-display text-2xl font-black text-[#1a1a1a] dark:text-zinc-100 mt-10 mb-4 pb-2 border-b border-gray-100 dark:border-zinc-800 scroll-mt-24">
          {text}
        </h2>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={key++} />);
    } else {
      elements.push(
        <p key={key++} className="mb-4 text-gray-800 dark:text-zinc-300 text-lg leading-relaxed font-body">
          {line}
        </p>
      );
    }
  }

  return elements;
}
