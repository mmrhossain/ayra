import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchAdminCategoryList,
  toCategoryErrorMessage,
} from "@/features/dashboard/admin/categories/api/categories";
import { CategoryTable } from "@/features/dashboard/admin/categories/components/category-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPageAccess("/admin/categories");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminCategoryList({ page: 1, limit: 20 });
  } catch (err) {
    error = toCategoryErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Categories" />
      {error || !initial ? (
        <PageError
          title="Could not load categories"
          message={error ?? "Unknown error"}
        />
      ) : (
        <CategoryTable initialData={initial} />
      )}
    </section>
  );
}
