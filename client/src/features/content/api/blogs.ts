/**
 * Public published blog reads for the storefront.
 * Admin blog CRUD lives in `@/features/dashboard/admin/blogs/api/blogs`.
 */
import { api } from "@/lib/api/store-front";
import type {
  Envelope,
  PublicBlogListResult,
  PublicBlogPost,
} from "@/features/content/types";

export type {
  PublicBlogListItem,
  PublicBlogListResult,
  PublicBlogPost,
} from "@/features/content/types";

export async function fetchPublicBlogs(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<PublicBlogListResult> {
  const res = await api.get<Envelope<PublicBlogListResult>>("/blogs", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      category: params?.category,
    },
  });
  return res.data;
}

export async function fetchPublicBlogBySlug(
  slug: string,
): Promise<PublicBlogPost> {
  const res = await api.get<Envelope<PublicBlogPost>>(`/blogs/${slug}`);
  return res.data;
}
