import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchInventoryList,
  toInventoryErrorMessage,
} from "@/features/dashboard/admin/inventory/api/inventory";
import { InventoryTable } from "@/features/dashboard/admin/inventory/components/inventory-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ variantId?: string; search?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {
  await requireAdminPageAccess("/admin/inventory");
  const { variantId, search } = await searchParams;
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchInventoryList({
      page: 1,
      limit: 20,
      variantId,
      search,
    });
  } catch (err) {
    error = toInventoryErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Search by product name or SKU."
      />
      {error || !initial ? (
        <PageError
          title="Could not load inventory"
          message={error ?? "Unknown error"}
        />
      ) : (
        <InventoryTable
          initialData={initial}
          initialVariantId={variantId}
          initialSearch={search}
        />
      )}
    </section>
  );
}
