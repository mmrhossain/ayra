export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type CategoryListItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  imagePublicId?: string | null;
  mobileImage?: string | null;
  cardImage?: string | null;
  isActive: boolean;
  parentId?: string | null;
  parentName?: string | null;
  childrenCount?: number;
  children?: CategoryListItem[];
};

export type CategoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CategoryListResult = {
  items: CategoryListItem[];
  pagination: CategoryPagination;
};

export type CategoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type FlatCategoryListItem = CategoryListItem & { depth: number };

export type CreateCategoryBody = {
  name: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  isActive?: boolean;
  parentId?: string | null;
};

export type DialogMode = "create" | "edit";

export type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: CategoryListItem;
  categories: Array<CategoryListItem | FlatCategoryListItem>;
};

export type CategoryDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryListItem | null;
};
