import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { FaqTable } from "@/features/dashboard/admin/faqs/components/faq-table";
import {
  fetchFaqCategories,
  fetchFaqItems,
  toFaqErrorMessage,
} from "@/features/dashboard/admin/faqs/api/faqs";

import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requireAdminPageAccess("/admin/faqs");
  let categories;
  let items;
  let error: string | null = null;

  try {
    [categories, items] = await Promise.all([
      fetchFaqCategories(),
      fetchFaqItems(),
    ]);
  } catch (err) {
    error = toFaqErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="FAQs"
        description="Categories and questions shown on the storefront FAQ page."
      />
      {error || !categories || !items ? (
        <PageError
          title="Could not load FAQs"
          message={error ?? "Unknown error"}
        />
      ) : (
        <FaqTable initialCategories={categories} initialItems={items} />
      )}
    </section>
  );
}
