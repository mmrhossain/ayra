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
  featured?: boolean;
  onSale?: boolean;
  sort?: ProductSort;
  includeInactive?: boolean;
};

export type CatalogOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment?: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  customerProfile?: {
    user?: { name?: string | null } | null;
  } | null;
};

export type ProductReviewPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductReviewListResult = {
  items: ProductReview[];
  pagination: ProductReviewPagination;
};

export type AttributeGroup = {
  attributeId: string;
  name: string;
  values: Array<{ id: string; value: string }>;
};

export type GalleryImage = {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
};

export type CategoryHeroProps = {
  parent_category?: {
    name?: string | null;
    image?: string | null;
    mobileImage?: string | null;
  } | null;
};

export type CategoryListItem = {
  id: string;
  name: string;
  parentSlug?: string | null;
  slug: string;
  description?: string | null;
  image?: string | null;
  imagePublicId?: string | null;
  mobileImage?: string | null;
  cardImage?: string | null;
  isActive: boolean;
  parentId?: string | null;
  children?: CategoryListItem[];
  productsCount?: number;
  totalProducts?: number;
  products?: unknown[];
};
