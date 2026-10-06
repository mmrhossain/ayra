/**
 * Public catalog reads (products, brands, category options). Store-front client.
 * Admin product CRUD lives in `@/features/dashboard/admin/products/api/products`.
 */
import type {
  CatalogOption,
  Envelope,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductListItem,
  ProductListParams,
  ProductListResult,
  ProductReview,
  ProductReviewListResult,
  ProductVariant,
} from "@/features/catalog/types";
import { api, ApiError } from "@/lib/api/store-front/index";

export type {
  AttributeGroup,
  CatalogOption,
  Envelope,
  GalleryImage,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductImageAsset,
  ProductListItem,
  ProductListParams,
  ProductListResult,
  ProductPagination,
  ProductReview,
  ProductReviewListResult,
  ProductReviewPagination,
  ProductSort,
  ProductVariant,
  ProductVariantAttribute,
} from "@/features/catalog/types";

export function normalizeVariantAttributes(
  variant: Pick<ProductVariant, "attributes">
): NormalizedVariantAttribute[] {
  return (variant.attributes ?? []).flatMap((attr) => {
    const nested = attr?.attributeValue;
    if (nested?.id) {
      const attributeId = nested.attributeId || nested.attribute?.id || "";
      if (!attributeId) return [];
      return [
        {
          id: nested.id,
          value: nested.value,
          attributeId,
          attributeName: nested.attribute?.name,
        },
      ];
    }
    const flat = attr as unknown as {
      attributeId?: string;
      valueId?: string;
      value?: string;
      attributeName?: string;
    };
    if (!flat.valueId || !flat.attributeId) return [];
    return [
      {
        id: flat.valueId,
        value: flat.value ?? "",
        attributeId: flat.attributeId,
        attributeName: flat.attributeName,
      },
    ];
  });
}

export async function fetchProductList(params: ProductListParams = {}): Promise<ProductListResult> {
  const res = await api.get<Envelope<ProductListResult>>("/products", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      category: params.category || undefined,
      brand: params.brand || undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      featured: params.featured === true ? true : undefined,
      onSale: params.onSale === true ? true : undefined,
      includeInactive: params.includeInactive === true ? true : undefined,
      sort: params.sort ?? "newest",
    },
  });
  return res.data;
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  const res = await api.get<Envelope<ProductDetail>>(`/products/${slug}`, {
    cache: "no-store",
  });
  return res.data;
}

export async function fetchBrands(): Promise<CatalogOption[]> {
  const res = await api.get<Envelope<CatalogOption[]>>("/brands");
  return res.data ?? [];
}

export async function fetchCategories(): Promise<CatalogOption[]> {
  const res = await api.get<Envelope<CatalogOption[]>>("/categories");
  return res.data ?? [];
}

export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  if (!slug) return null;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchProductBySlug(slug);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && err.status === 404) return null;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to load product");
}

export async function fetchProducts(
  params: ProductListParams = {}
): Promise<ProductListResult | null> {
  try {
    return await fetchProductList({
      page: 1,
      limit: 20,
      sort: "newest",
      ...params,
      includeInactive: false,
    });
  } catch {
    return null;
  }
}

export async function fetchProductsByRemark(remark: string): Promise<ProductListResult | null> {
  try {
    const res = await api.get<Envelope<ProductListResult>>("/products", {
      params: { remarks: remark },
    });
    return res.data;
  } catch {
    return null;
  }
}

export async function searchProduct(keyword: string): Promise<ProductListResult | null> {
  try {
    return await fetchProductList({
      search: keyword,
      includeInactive: false,
    });
  } catch {
    return null;
  }
}

export function toCatalogErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function productPrice(item: ProductListItem): number | null {
  const prices =
    item?.variants?.map((v) => Number(v.price)).filter((n) => Number.isFinite(n)) ?? [];
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function productPriceRange(item: ProductListItem): {
  min: number;
  max: number;
} | null {
  const prices =
    item?.variants?.map((v) => Number(v.price)).filter((n) => Number.isFinite(n)) ?? [];
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function productStockSum(item: ProductListItem): number {
  return item?.variants?.reduce((sum, variant) => sum + (variant.availableStock ?? 0), 0) ?? 0;
}

export async function fetchProductReviews(
  productId: string,
  page = 1,
  limit = 10
): Promise<ProductReviewListResult> {
  const res = await api.get<Envelope<ProductReviewListResult>>(`/products/${productId}/reviews`, {
    params: { page, limit },
  });
  return {
    items: res.data?.items ?? [],
    pagination: res.data?.pagination ?? {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

export function reviewDisplayName(review: ProductReview): string {
  const name = review.customerProfile?.user?.name?.trim();
  return name || "Customer";
}
