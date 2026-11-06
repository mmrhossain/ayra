import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { BlogTable } from "@/features/dashboard/admin/blogs/components/blog-table";
import {
  fetchBlogCategories,
  fetchBlogList,
  toBlogErrorMessage,
} from "@/features/dashboard/admin/blogs/api/blogs";

import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireAdminPageAccess("/admin/blogs");
  let posts;
  let categories;
  let error: string | null = null;

  try {
    [posts, categories] = await Promise.all([
      fetchBlogList({ page: 1, limit: 20 }),
      fetchBlogCategories(),
    ]);
  } catch (err) {
    error = toBlogErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Categories and posts shown on the storefront blog pages."
      />
      {error || !posts || !categories ? (
        <PageError
          title="Could not load blogs"
          message={error ?? "Unknown error"}
        />
      ) : (
        <BlogTable initialPosts={posts} initialCategories={categories} />
      )}
    </section>
  );
}
