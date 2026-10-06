import { FaqTable } from "@/features/dashboard/admin/faqs/components/faq-table";
import {
  fetchFaqCategories,
  fetchFaqItems,
  toFaqErrorMessage,
} from "@/features/dashboard/admin/faqs/api/faqs";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
        <p className="text-sm text-muted-foreground">
          Categories and questions shown on the storefront FAQ page.
        </p>
      </div>
      {error || !categories || !items ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load FAQs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <FaqTable initialCategories={categories} initialItems={items} />
      )}
    </section>
  );
}
