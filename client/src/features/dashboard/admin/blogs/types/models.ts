export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export const BLOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export type BlogCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogCategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: BlogStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  categoryId: string | null;
  category: BlogCategoryRef | null;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BlogListResult = {
  items: BlogListItem[];
  pagination: BlogPagination;
};

export type BlogListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus;
  categoryId?: string;
};

export type CreateBlogCategoryBody = {
  name: string;
  slug: string;
};

export type CreateBlogBody = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export type UpdateBlogBody = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  featuredImage?: string | null;
  categoryId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  status?: BlogStatus;
};
