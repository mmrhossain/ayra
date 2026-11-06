import type { ProductListParams as CatalogProductListParams } from "@/features/catalog/types";

export type { Envelope } from "@/lib/api/http";
export type {
  CatalogOption,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductImageAsset,
  ProductListItem,
  ProductListResult,
  ProductPagination,
  ProductSort,
  ProductVariant,
  ProductVariantAttribute,
} from "@/features/catalog/types";

export type ProductListParams = CatalogProductListParams & {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
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
  variants?: CreateVariantBody[];
  variantDefaults?: { price: number; costPrice?: number };
};

export type CreateVariantBody = {
  id?: string;
  sku?: string;
  price: number;
  costPrice?: number | null;
  isDefault?: boolean;
  attributeValueIds?: string[];
};

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type BulkProductAction =
  | { type: "set-status"; ids: string[]; status: ProductStatus }
  | { type: "set-featured"; ids: string[]; isFeatured: boolean }
  | { type: "set-category"; ids: string[]; categoryId: string }
  | { type: "delete"; ids: string[] };

export type BulkProductResult = {
  requested: number;
  affected: number;
  failed: string[];
};
