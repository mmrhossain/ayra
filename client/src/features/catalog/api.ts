/**
 * Public catalog reads (products, brands, categories). Store-front client.
 * Admin CRUD lives in the dashboard admin API modules.
 */
import type {
  AttributeFilterGroups,
  CatalogOption,
  CategoryListItem,
  Envelope,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductFacets,
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
  AttributeFilterGroups,
  CatalogOption,
  CategoryListItem,
  Envelope,
  FacetAttribute,
  FacetCategory,
  FacetOption,
  GalleryImage,
  NormalizedVariantAttribute,
  PriceBucket,
  ProductDetail,
  ProductFacets,
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

type FetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
};

export type FlatCategoryListItem = CategoryListItem & { depth: number };

export function flattenCategories(
  items: CategoryListItem[],
  depth = 0,
): FlatCategoryListItem[] {
  const result: FlatCategoryListItem[] = [];
  for (const item of items) {
    result.push({ ...item, depth });
    if (item.children?.length) {
      result.push(...flattenCategories(item.children, depth + 1));
    }
  }
  return result;
}

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
          color: nested.color ?? null,
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

export const parseAttributesParam = (
  raw: string | null | undefined,
): AttributeFilterGroups => {
  if (!raw) return {};
  const groups: AttributeFilterGroups = {};
  for (const chunk of raw.split("~")) {
    const separatorIndex = chunk.indexOf(":");
    if (separatorIndex <= 0) continue;
    const attributeId = chunk.slice(0, separatorIndex).trim();
    const valueIds = chunk
      .slice(separatorIndex + 1)
      .split(",")
      .map((valueId) => valueId.trim())
      .filter(Boolean);
    if (attributeId && valueIds.length > 0) {
      groups[attributeId] = valueIds;
    }
  }
  return groups;
};

export const serializeAttributesParam = (
  attributes: AttributeFilterGroups | undefined,
): string | undefined => {
  if (!attributes) return undefined;
  const chunks = Object.entries(attributes)
    .filter(([, valueIds]) => valueIds.length > 0)
    .map(([attributeId, valueIds]) => `${attributeId}:${valueIds.join(",")}`);
  return chunks.length > 0 ? chunks.join("~") : undefined;
};

export const parseCategoriesParam = (
  raw: string | null | undefined,
): string[] =>
  raw
    ? raw
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean)
    : [];

export const serializeCategoriesParam = (
  categories: string[] | undefined,
): string | undefined =>
  categories && categories.length > 0 ? categories.join(",") : undefined;

export async function fetchProductList(params: ProductListParams = {}): Promise<ProductListResult> {
  const res = await api.get<Envelope<ProductListResult>>("/products", {
    next: { revalidate: 60, tags: ["products"] },
    params: {
      page: params.page,
      limit: params.limit ?? 20,
      cursor: params.cursor,
      search: params.search || undefined,
      category: params.category || undefined,
      brand: params.brand || undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      featured: params.featured === true ? true : undefined,
      onSale: params.onSale === true ? true : undefined,
      includeInactive: params.includeInactive === true ? true : undefined,
      sort: params.sort ?? "newest",
      attrs: serializeAttributesParam(params.attributes),
      categories: serializeCategoriesParam(params.categories),
    },
  });
  return res.data;
}

export async function fetchProductFacets(
  params: ProductListParams = {},
): Promise<ProductFacets> {
  const res = await api.get<Envelope<ProductFacets>>("/products/facets", {
    next: { revalidate: 60, tags: ["products", "categories"] },
    params: {
      category: params.category || undefined,
      brand: params.brand || undefined,
      search: params.search || undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      featured: params.featured === true ? true : undefined,
      onSale: params.onSale === true ? true : undefined,
      attrs: serializeAttributesParam(params.attributes),
      categories: serializeCategoriesParam(params.categories),
    },
  });
  return res.data;
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  const res = await api.get<Envelope<ProductDetail>>(`/products/${slug}`, {
    next: { revalidate: 120, tags: ["product", `product:${slug}`] },
  });
  return res.data;
}

export async function fetchBrands(): Promise<CatalogOption[]> {
  const res = await api.get<Envelope<CatalogOption[]>>("/brands", {
    next: { revalidate: 300, tags: ["brands"] },
  });
  return res.data ?? [];
}

export async function getCategories(options?: FetchOptions): Promise<CategoryListItem[]> {
  const { next } = options || {};
  const tags = Array.from(new Set(["categories", ...(next?.tags || [])]));

  const res = await api.get<Envelope<CategoryListItem[]>>("/categories", {
    next: {
      revalidate: next?.revalidate ?? 60,
      tags,
    },
  });
  return res.data ?? [];
}

export async function fetchCategoryList(options?: FetchOptions): Promise<CategoryListItem[]> {
  return getCategories(options);
}

export async function fetchCategories(options?: FetchOptions): Promise<CategoryListItem[]> {
  return getCategories(options);
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryListItem> {
  const path = slug
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .filter(Boolean)
    .join("/");

  try {
    const res = await api.get<Envelope<CategoryListItem>>(`/categories/${path}`, {
      next: { revalidate: 60, tags: ["categories", `category:${slug}`] },
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Error("Category not found");
    }
    throw err;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryListItem | null> {
  if (!slug) return null;
  try {
    return await fetchCategoryBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    if (err instanceof Error && err.message === "Category not found") return null;
    throw err;
  }
}

export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  if (!slug) return null;

  try {
    return await fetchProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    if (err instanceof ApiError && err.status >= 500) {
      try {
        return await fetchProductBySlug(slug);
      } catch (retryErr) {
        if (retryErr instanceof ApiError && retryErr.status === 404) return null;
        throw retryErr;
      }
    }
    throw err;
  }
}

export async function fetchProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  return fetchProductList({
    limit: 20,
    sort: "newest",
    ...params,
    includeInactive: false,
  });
}

export async function fetchProductsByRemark(remark: string): Promise<ProductListResult> {
  const res = await api.get<Envelope<ProductListResult>>("/products", {
    next: { revalidate: 60, tags: ["products"] },
    params: { remarks: remark },
  });
  return res.data;
}

export async function searchProduct(keyword: string): Promise<ProductListResult> {
  return fetchProductList({
    search: keyword,
    includeInactive: false,
  });
}

export function toCatalogErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Please sign in to continue";
    if (err.status === 429) return "Too many requests. Try again shortly.";
    if (err.status >= 500 || err.status === 0) return "Service unavailable";
    return err.message;
  }
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
    next: { revalidate: 60, tags: [`product-reviews:${productId}`] },
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
