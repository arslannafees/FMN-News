export interface ArticleComment {
  id: string;
  author: string;
  content: string;
  upvotes?: number;
  parentId?: string;
  createdAt: string;
  replies?: ArticleComment[];
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  title?: string;
  twitter?: string;
  website?: string;
  email?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorId?: string;
  authorRel?: Author;
  image: string;
  time: string;
  readTime?: string;
  featured?: boolean;
  isBreaking?: boolean;
  views?: number;
  tags?: string[];
  publishAt?: string;
  status?: string;
  articleType?: string;
  dateline?: string;
  imageCaption?: string;
  imageCredit?: string;
  correction?: string;
  editedBy?: string;
  series?: string;
  seriesPart?: number;
  seriesTotal?: number;
  factCheckVerdict?: string;
  lastVerified?: string;
  aboutArticle?: string;
  sources?: string;
  comments?: ArticleComment[];
  createdAt: string;
  updatedAt: string;
}

export interface LiveBlogUpdate {
  id: string;
  liveblogId: string;
  content: string;
  label?: string;
  isPinned: boolean;
  timestamp: string;
}

export interface LiveBlog {
  id: string;
  articleId: string;
  title: string;
  isLive: boolean;
  createdAt: string;
  updates: LiveBlogUpdate[];
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
