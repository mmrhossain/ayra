import { fetchBlogCategories, fetchBlogList } from "@/features/dashboard/admin/blogs/api/blogs";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { BlogTable } from "@/features/dashboard/admin/blogs/components/blog-table";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireAdminPageAccess("/admin/blogs");
  const [initialPosts, initialCategories] = await Promise.all([fetchBlogList({ page: 1, limit: 20 }), fetchBlogCategories()]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Categories and posts shown on the storefront blog pages."
      />
      <BlogTable initialPosts={initialPosts} initialCategories={initialCategories} />
    </section>
  );
}
