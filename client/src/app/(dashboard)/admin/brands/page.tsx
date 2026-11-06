import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchAdminBrandList,
  toBrandErrorMessage,
} from "@/features/dashboard/admin/brands/api/brands";
import { BrandTable } from "@/features/dashboard/admin/brands/components/brand-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  await requireAdminPageAccess("/admin/brands");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminBrandList({ page: 1, limit: 20 });
  } catch (err) {
    error = toBrandErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Brands" />
      {error || !initial ? (
        <PageError
          title="Could not load brands"
          message={error ?? "Unknown error"}
        />
      ) : (
        <BrandTable initialData={initial} />
      )}
    </section>
  );
}
