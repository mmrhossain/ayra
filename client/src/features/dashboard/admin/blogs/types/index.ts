import type { BlogCategoryListItem, BlogListItem, BlogListResult } from "./models";

export {
  BLOG_STATUSES,
} from "./models";

export type {
  Envelope,
  BlogStatus,
  BlogCategoryListItem,
  BlogCategoryRef,
  BlogListItem,
  BlogPagination,
  BlogListResult,
  BlogListParams,
  CreateBlogCategoryBody,
  CreateBlogBody,
  UpdateBlogBody,
} from "./models";

export type DialogMode = "create" | "edit";

export type BlogTableProps = {
  initialPosts: BlogListResult;
  initialCategories: BlogCategoryListItem[];
};

export type BlogFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  categories: BlogCategoryListItem[];
  initialData?: BlogListItem;
};

export type BlogPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogListItem | null;
};

export type BlogDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogListItem | null;
};

export type BlogCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: BlogCategoryListItem;
};

export type BlogCategoryDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BlogCategoryListItem | null;
};
