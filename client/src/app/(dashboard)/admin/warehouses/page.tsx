import { WarehouseTable } from "@/features/dashboard/admin/warehouses/components/warehouse-table";
import {
  fetchWarehouseList,
  toWarehouseErrorMessage,
} from "@/features/dashboard/admin/warehouses/api/warehouses";

export const dynamic = "force-dynamic";

export default async function AdminWarehousesPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchWarehouseList({ page: 1, limit: 20 });
  } catch (err) {
    error = toWarehouseErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
        <p className="text-sm text-muted-foreground">
          Locations used by inventory stock and adjustments.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load warehouses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <WarehouseTable initialData={initial} />
      )}
    </section>
  );
}
