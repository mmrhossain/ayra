import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { BlogTable } from "@/features/dashboard/admin/blogs/components/blog-table";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  await requireAdminPageAccess("/admin/blogs");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Categories and posts shown on the storefront blog pages."
      />
      <BlogTable />
    </section>
  );
}
