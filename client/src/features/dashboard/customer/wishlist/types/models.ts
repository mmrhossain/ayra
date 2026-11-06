export type { Envelope } from "@/lib/api/http";

export type WishlistVariantImage = {
  id: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
};

export type WishlistVariant = {
  id: string;
  sku?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  isDefault?: boolean;
  availableStock?: number | null;
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: WishlistVariantImage[];
  } | null;
};

export type WishlistItem = {
  id: string;
  variantId: string;
  createdAt?: string;
  variant?: WishlistVariant | null;
};

export type WishlistPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type WishlistListResult = {
  items: WishlistItem[];
  pagination: WishlistPagination;
};
