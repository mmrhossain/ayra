import { fetchOrderList, toOrderErrorMessage } from "@/features/dashboard/admin/orders/api/orders";
import { OrderTable } from "@/features/dashboard/admin/orders/components/order-table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchOrderList({ page: 1, limit: 20 });
  } catch (err) {
    error = toOrderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        {/* <p className="text-sm text-muted-foreground">
          Fulfillment list from the live backend.
        </p> */}
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <OrderTable initialData={initial} />
      )}
    </section>
  );
}
