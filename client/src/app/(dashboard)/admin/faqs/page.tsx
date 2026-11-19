import { fetchFaqCategories, fetchFaqItems } from "@/features/dashboard/admin/faqs/api/faqs";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { FaqTable } from "@/features/dashboard/admin/faqs/components/faq-table";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requireAdminPageAccess("/admin/faqs");
  const [initialCategories, initialItems] = await Promise.all([fetchFaqCategories(), fetchFaqItems()]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="FAQs"
        description="Categories and questions shown on the storefront FAQ page."
      />
      <FaqTable initialCategories={initialCategories} initialItems={initialItems} />
    </section>
  );
}
