export type { Envelope } from "@/lib/api/http";

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
    color?: string | null;
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
  costPrice?: number | string | null;
  weight?: number | string | null;
  isDefault?: boolean;
  availableStock?: number;
  attributes?: ProductVariantAttribute[];
};

export type NormalizedVariantAttribute = {
  id: string;
  value: string;
  color?: string | null;
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

export type AttributeFilterGroups = Record<string, string[]>;

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
  attributes?: AttributeFilterGroups;
  categories?: string[];
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
  values: Array<{ id: string; value: string; color?: string | null }>;
};

export type GalleryImage = {
  id?: string | number;
  imageUrl?: string;
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
  path?: string;
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
};

export type FacetOption = {
  valueId: string;
  label: string;
  color?: string | null;
};

export type FacetAttribute = {
  attributeId: string;
  name: string;
  options: FacetOption[];
};

export type FacetCategory = {
  id: string;
  slug: string;
  label: string;
};

export type PriceBucket = {
  from: number;
  to: number;
};

export type ProductFacets = {
  price: { min: number | null; max: number | null; buckets: PriceBucket[] };
  categories?: FacetCategory[];
  attributes: FacetAttribute[];
};
