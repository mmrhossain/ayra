import {
  fetchInventoryList,
  toInventoryErrorMessage,
} from "@/features/dashboard/admin/inventory/api/inventory";
import { InventoryTable } from "@/features/dashboard/admin/inventory/components/inventory-table";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ variantId?: string; search?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Search by product name or SKU.</p>
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <InventoryTable initialData={initial} initialVariantId={variantId} initialSearch={search} />
      )}
    </section>
  );
}
