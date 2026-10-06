import {
  fetchAdminCategoryList,
  toCategoryErrorMessage,
} from "@/features/dashboard/admin/categories/api/categories";
import { CategoryTable } from "@/features/dashboard/admin/categories/components/category-table";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminCategoryList({ page: 1, limit: 20 });
  } catch (err) {
    error = toCategoryErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <CategoryTable initialData={initial} />
      )}
    </section>
  );
}
