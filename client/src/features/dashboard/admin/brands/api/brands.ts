/**
 * Admin brand CRUD. Authenticated dashboard client only.
 * Public brand GET lives in `@/features/catalog/api`.
 */
import { dashboardApi } from "@/lib/api/dashboard";
import type {
  BrandListItem,
  BrandListParams,
  BrandListResult,
  CreateBrandBody,
  Envelope,
} from "@/features/dashboard/admin/brands/types";

export type {
  Envelope,
  BrandListItem,
  BrandPagination,
  BrandListResult,
  BrandListParams,
  CreateBrandBody,
} from "@/features/dashboard/admin/brands/types";

export {
  toBrandDeleteErrorMessage,
  toBrandErrorMessage,
} from "@/features/dashboard/admin/brands/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAdminBrandList(
  params: BrandListParams = {},
  options?: {
    cache?: RequestCache;
    next?: { revalidate?: number | false; tags?: string[] };
  },
): Promise<BrandListResult> {
  const res = await dashboardApi.get<Envelope<BrandListResult>>(
    "/admin/brands",
    {
      ...(options ?? noStore),
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search || undefined,
      },
    },
  );
  return res.data;
}

export async function createBrand(body: CreateBrandBody): Promise<BrandListItem> {
  const res = await dashboardApi.post<Envelope<BrandListItem>>(
    "/admin/brands",
    { body },
  );
  return res.data;
}

export async function updateBrand(
  id: string,
  body: Partial<CreateBrandBody>,
): Promise<BrandListItem> {
  const res = await dashboardApi.put<Envelope<BrandListItem>>(
    `/admin/brands/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteBrand(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/brands/${id}`);
}
