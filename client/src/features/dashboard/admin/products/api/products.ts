import { dashboardApi } from "@/lib/api/dashboard";
import type {
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
} from "@/features/dashboard/admin/products/types";

export {
  normalizeVariantAttributes,
  toErrorMessage,
  productPrice,
  productPriceRange,
  productStockSum,
} from "@/features/dashboard/admin/products/utils";

const noStore = { cache: "no-store" as const };

export async function fetchProductList(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  const res = await dashboardApi.get<Envelope<ProductListResult>>("/products", {
    ...noStore,
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
    noStore,
  );
  return res.data;
}

export async function createProduct(
  body: CreateProductBody,
): Promise<{ id: string }> {
  const res = await dashboardApi.post<Envelope<{ id: string }>>(
    "/admin/products",
    { body },
  );
  return res.data;
}

export async function updateProduct(
  id: string,
  body: Partial<CreateProductBody>,
): Promise<{ id: string }> {
  const res = await dashboardApi.put<Envelope<{ id: string }>>(
    `/admin/products/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/products/${id}`);
}

export async function createProductVariant(
  productId: string,
  body: CreateVariantBody,
): Promise<{ id: string }> {
  const res = await dashboardApi.post<Envelope<{ id: string }>>(
    `/admin/products/${productId}/variants`,
    { body },
  );
  return res.data;
}

export async function updateProductVariant(
  id: string,
  body: Partial<CreateVariantBody>,
): Promise<{ id: string }> {
  const res = await dashboardApi.put<Envelope<{ id: string }>>(
    `/admin/variants/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteProductVariant(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/variants/${id}`);
}
