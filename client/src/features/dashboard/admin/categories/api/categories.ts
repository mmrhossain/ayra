/**
 * Admin category CRUD. Authenticated dashboard client only.
 * Public category GET lives in `@/features/catalog/categories-api`.
 */
import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CategoryListItem,
  CategoryListParams,
  CategoryListResult,
  CreateCategoryBody,
  Envelope,
} from "@/features/dashboard/admin/categories/types";

export type {
  Envelope,
  CategoryListItem,
  CategoryPagination,
  CategoryListResult,
  CategoryListParams,
  FlatCategoryListItem,
  CreateCategoryBody,
} from "@/features/dashboard/admin/categories/types";

export {
  flattenCategories,
  toCategoryDeleteErrorMessage,
  toCategoryErrorMessage,
} from "@/features/dashboard/admin/categories/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAdminCategoryList(
  params: CategoryListParams = {},
  options?: {
    cache?: RequestCache;
    next?: { revalidate?: number | false; tags?: string[] };
  },
): Promise<CategoryListResult> {
  const res = await dashboardApi.get<Envelope<CategoryListResult>>(
    "/admin/categories",
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

export async function fetchCategoryList(options?: {
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}): Promise<CategoryListItem[]> {
  const res = await dashboardApi.get<Envelope<CategoryListItem[]>>(
    "/admin/categories",
    options ?? noStore,
  );
  return res.data ?? [];
}

export async function createCategory(
  body: CreateCategoryBody,
): Promise<CategoryListItem> {
  const res = await dashboardApi.post<Envelope<CategoryListItem>>(
    "/admin/categories",
    { body },
  );
  return res.data;
}

export async function updateCategory(
  id: string,
  body: Partial<CreateCategoryBody>,
): Promise<CategoryListItem> {
  const res = await dashboardApi.put<Envelope<CategoryListItem>>(
    `/admin/categories/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/categories/${id}`);
}
