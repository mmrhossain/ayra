export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type PublicFaqCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  items: PublicFaqItem[];
};

export const LEGAL_TYPES = ["PRIVACY", "TERMS"] as const;

export type LegalType = (typeof LEGAL_TYPES)[number];

export type PublishedLegalDocument = {
  type: LegalType;
  version: string;
  title: string;
  body: string;
  effectiveAt?: string | null;
  updatedAt?: string;
};

export type PublicBlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicBlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  category: PublicBlogCategory | null;
};

export type PublicBlogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicBlogListResult = {
  items: PublicBlogListItem[];
  pagination: PublicBlogPagination;
};

export type PublicBlogPost = PublicBlogListItem & {
  content: string;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt?: string;
  updatedAt?: string;
};
