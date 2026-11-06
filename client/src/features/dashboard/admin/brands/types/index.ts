export type { Envelope } from "@/lib/api/http";

export type BrandListItem = {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  logoPublicId?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type BrandPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BrandListResult = {
  items: BrandListItem[];
  pagination: BrandPagination;
};

export type BrandListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateBrandBody = {
  name: string;
  slug?: string;
  description?: string;
  logo?: string | null;
  logoPublicId?: string | null;
  isActive?: boolean;
};

export type DialogMode = "create" | "edit";

export type BrandFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: BrandListItem;
};

export type BrandDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandListItem | null;
};
