import { BlogTable } from "@/features/dashboard/admin/blogs/components/blog-table";
import {
  fetchBlogCategories,
  fetchBlogList,
  toBlogErrorMessage,
} from "@/features/dashboard/admin/blogs/api/blogs";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blogs</h1>
        <p className="text-sm text-muted-foreground">
          Categories and posts shown on the storefront blog pages.
        </p>
      </div>
      {error || !posts || !categories ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load blogs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <BlogTable initialPosts={posts} initialCategories={categories} />
      )}
    </section>
  );
}
