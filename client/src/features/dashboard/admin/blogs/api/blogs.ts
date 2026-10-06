import { dashboardApi } from "@/lib/api/dashboard";
import type {
  BlogCategoryListItem,
  BlogListItem,
  BlogListParams,
  BlogListResult,
  CreateBlogBody,
  CreateBlogCategoryBody,
  Envelope,
  UpdateBlogBody,
} from "@/features/dashboard/admin/blogs/types";

export type {
  Envelope,
  BlogCategoryListItem,
  BlogListItem,
  BlogListResult,
  CreateBlogBody,
  CreateBlogCategoryBody,
} from "@/features/dashboard/admin/blogs/types";

export {
  toBlogCategoryDeleteErrorMessage,
  toBlogErrorMessage,
} from "@/features/dashboard/admin/blogs/utils";

const noStore = { cache: "no-store" as const };

export async function fetchBlogCategories(): Promise<BlogCategoryListItem[]> {
  const res = await dashboardApi.get<Envelope<BlogCategoryListItem[]>>(
    "/admin/blog-categories",
    noStore,
  );
  return res.data ?? [];
}

export async function createBlogCategory(
  body: CreateBlogCategoryBody,
): Promise<BlogCategoryListItem> {
  const res = await dashboardApi.post<Envelope<BlogCategoryListItem>>(
    "/admin/blog-categories",
    { body },
  );
  return res.data;
}

export async function updateBlogCategory(
  id: string,
  body: Partial<CreateBlogCategoryBody>,
): Promise<BlogCategoryListItem> {
  const res = await dashboardApi.put<Envelope<BlogCategoryListItem>>(
    `/admin/blog-categories/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteBlogCategory(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/blog-categories/${id}`);
}

export async function fetchBlogList(
  params: BlogListParams = {},
): Promise<BlogListResult> {
  const res = await dashboardApi.get<Envelope<BlogListResult>>("/admin/blogs", {
    ...noStore,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      status: params.status,
      categoryId: params.categoryId,
    },
  });
  return res.data;
}

export async function createBlog(body: CreateBlogBody): Promise<BlogListItem> {
  const res = await dashboardApi.post<Envelope<BlogListItem>>("/admin/blogs", {
    body,
  });
  return res.data;
}

export async function updateBlog(
  id: string,
  body: UpdateBlogBody,
): Promise<BlogListItem> {
  const res = await dashboardApi.put<Envelope<BlogListItem>>(`/admin/blogs/${id}`, {
    body,
  });
  return res.data;
}

export async function publishBlog(id: string): Promise<BlogListItem> {
  const res = await dashboardApi.post<Envelope<BlogListItem>>(
    `/admin/blogs/${id}/publish`,
  );
  return res.data;
}

export async function deleteBlog(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/blogs/${id}`);
}
