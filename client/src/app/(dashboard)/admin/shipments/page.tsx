import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { Suspense } from "react";

import {
  fetchShipmentList,
  toShipmentErrorMessage,
} from "@/features/dashboard/admin/shipments/api/shipments";
import { ShipmentsTable } from "@/features/dashboard/admin/shipments/components/shipments-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage() {
  await requireAdminPageAccess("/admin/shipments");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchShipmentList({ page: 1, limit: 20 });
  } catch (err) {
    error = toShipmentErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Shipments"
        description="Pack orders, assign couriers, and track delivery status."
      />
      {error || !initial ? (
        <PageError
          title="Could not load shipments"
          message={error ?? "Unknown error"}
        />
      ) : (
        <Suspense fallback={null}>
          <ShipmentsTable initialData={initial} />
        </Suspense>
      )}
    </section>
  );
}
