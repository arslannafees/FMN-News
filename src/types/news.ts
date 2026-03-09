export interface ArticleComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image: string;
  time: string;
  readTime?: string;
  featured?: boolean;
  isBreaking?: boolean;
  comments?: ArticleComment[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoStory {
  id: string;
  title: string;
  duration: string;
  image: string;
  url?: string;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  count: string;
  size: 'small' | 'medium' | 'large';
}

export type Category =
  | 'World'
  | 'Politics'
  | 'Business'
  | 'Sports'
  | 'Entertainment'
  | 'Science'
  | 'Health';
