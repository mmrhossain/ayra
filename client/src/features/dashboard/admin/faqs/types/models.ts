export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type FaqCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type FaqItemListItem = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateFaqCategoryBody = {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type CreateFaqItemBody = {
  categoryId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
};
