export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  images: Array<{ imageUrl: string }>;
  variants: Array<{
    id: string;
    sku?: string;
    price: number | string;
    compareAtPrice?: number | string | null;
    isDefault?: boolean;
    availableStock?: number;
  }>;
};

export type ProductImageAsset = {
  id: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
};

export type ProductVariantAttribute = {
  attributeValue: {
    id: string;
    value: string;
    attributeId: string;
    attribute?: { id: string; name: string };
  };
};

export type ProductVariant = {
  id: string;
  sku: string;
  barcode?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  weight?: number | string | null;
  isDefault?: boolean;
  availableStock?: number;
  images?: ProductImageAsset[];
  attributes?: ProductVariantAttribute[];
};

export type NormalizedVariantAttribute = {
  id: string;
  value: string;
  attributeId: string;
  attributeName?: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  images?: ProductImageAsset[];
  variants: ProductVariant[];
};

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  items: ProductListItem[];
  pagination: ProductPagination;
};

export type ProductSort = "newest" | "price_asc" | "price_desc" | "popular";

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  includeInactive?: boolean;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export type CatalogOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImageInput = {
  url: string;
  isPrimary: boolean;
};

export type CreateProductBody = {
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brandId?: string | null;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured?: boolean;
  images?: ProductImageInput[];
};

export type CreateVariantBody = {
  sku: string;
  price: number;
  isDefault?: boolean;
  attributeValueIds?: string[];
};
