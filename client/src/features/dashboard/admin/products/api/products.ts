import { dashboardApi } from "@/lib/api/dashboard";
import type {
  BulkProductAction,
  BulkProductResult,
  CreateProductBody,
  CreateVariantBody,
  Envelope,
  ProductDetail,
  ProductListParams,
  ProductListResult,
} from "@/features/dashboard/admin/products/types";

export type {
  Envelope,
  ProductListItem,
  ProductImageAsset,
  ProductVariantAttribute,
  ProductVariant,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductPagination,
  ProductListResult,
  ProductSort,
  ProductListParams,
  CatalogOption,
  ProductImageInput,
  CreateProductBody,
  CreateVariantBody,
  ProductStatus,
  BulkProductAction,
  BulkProductResult,
} from "@/features/dashboard/admin/products/types";

export {
  normalizeVariantAttributes,
  toErrorMessage,
  productPrice,
  productPriceRange,
  productStockSum,
} from "@/features/dashboard/admin/products/utils";

const noStore = { cache: "no-store" as const };

// Product reads and writes run heavy, multi-round-trip queries (joins across
// variants, inventories, attributes) or a multi-step transaction. On a remote
// database these can legitimately exceed the 10s default, so every product call
// gets a budget that outlives the server's own query/transaction timeout (30s)
// instead of aborting a request the backend is still honoring.
const parsedProductApiTimeoutMs = Number(
  process.env.NEXT_PUBLIC_PRODUCT_API_TIMEOUT_MS,
);
export const PRODUCT_API_TIMEOUT_MS =
  Number.isFinite(parsedProductApiTimeoutMs) && parsedProductApiTimeoutMs > 0
    ? parsedProductApiTimeoutMs
    : 60_000;

export async function fetchProductList(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  const res = await dashboardApi.get<Envelope<ProductListResult>>("/products", {
    ...noStore,
    timeoutMs: PRODUCT_API_TIMEOUT_MS,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      category: params.category || undefined,
      brand: params.brand || undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      includeInactive: params.includeInactive === true ? true : undefined,
      status: params.status,
      sort: params.sort ?? "newest",
    },
  });
  return res.data;
}

export async function fetchAdminProduct(id: string): Promise<ProductDetail> {
  const res = await dashboardApi.get<Envelope<ProductDetail>>(
    `/admin/products/${id}`,
    { ...noStore, timeoutMs: PRODUCT_API_TIMEOUT_MS },
  );
  return res.data;
}

export async function createProduct(
  body: CreateProductBody,
  idempotencyKey?: string,
): Promise<ProductDetail> {
  const res = await dashboardApi.post<Envelope<ProductDetail>>(
    "/admin/products",
    {
      body,
      timeoutMs: PRODUCT_API_TIMEOUT_MS,
      ...(idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {}),
    },
  );
  return res.data;
}

export async function updateProduct(
  id: string,
  body: Partial<CreateProductBody>,
  idempotencyKey?: string,
): Promise<ProductDetail> {
  const res = await dashboardApi.put<Envelope<ProductDetail>>(
    `/admin/products/${id}`,
    {
      body,
      timeoutMs: PRODUCT_API_TIMEOUT_MS,
      ...(idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {}),
    },
  );
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/products/${id}`, {
    timeoutMs: PRODUCT_API_TIMEOUT_MS,
  });
}

export async function bulkUpdateProducts(
  body: BulkProductAction,
  idempotencyKey?: string,
): Promise<BulkProductResult> {
  const res = await dashboardApi.patch<Envelope<BulkProductResult>>(
    "/admin/products/bulk",
    {
      body,
      timeoutMs: PRODUCT_API_TIMEOUT_MS,
      ...(idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {}),
    },
  );
  return res.data;
}

export async function createProductVariant(
  productId: string,
  body: CreateVariantBody,
): Promise<{ id: string; sku: string }> {
  const res = await dashboardApi.post<Envelope<{ id: string; sku: string }>>(
    `/admin/products/${productId}/variants`,
    { body, timeoutMs: PRODUCT_API_TIMEOUT_MS },
  );
  return res.data;
}

export async function updateProductVariant(
  id: string,
  body: Partial<CreateVariantBody>,
): Promise<{ id: string }> {
  const res = await dashboardApi.put<Envelope<{ id: string }>>(
    `/admin/variants/${id}`,
    { body, timeoutMs: PRODUCT_API_TIMEOUT_MS },
  );
  return res.data;
}

export async function deleteProductVariant(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/variants/${id}`, {
    timeoutMs: PRODUCT_API_TIMEOUT_MS,
  });
}
