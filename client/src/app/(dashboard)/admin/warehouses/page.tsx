import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { WarehouseTable } from "@/features/dashboard/admin/warehouses/components/warehouse-table";
import {
  fetchWarehouseList,
  toWarehouseErrorMessage,
} from "@/features/dashboard/admin/warehouses/api/warehouses";
import { Suspense } from "react";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminWarehousesPage() {
  await requireAdminPageAccess("/admin/warehouses");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchWarehouseList({ page: 1, limit: 20 });
  } catch (err) {
    error = toWarehouseErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Locations used by inventory stock and adjustments."
      />
      {error || !initial ? (
        <PageError
          title="Could not load warehouses"
          message={error ?? "Unknown error"}
        />
      ) : (
        <Suspense fallback={null}>
          <WarehouseTable initialData={initial} />
        </Suspense>
      )}
    </section>
  );
}
