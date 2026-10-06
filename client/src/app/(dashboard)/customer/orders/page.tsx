import { OrderTable } from "@/features/dashboard/customer/orders/components/order-table";
import {
  fetchMyOrders,
  toCustomerApiError,
} from "@/features/dashboard/customer/orders/api/orders";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchMyOrders({ page: 1, limit: 20 });
  } catch (err) {
    error = toCustomerApiError(err);
  }

  if (error || !initial) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return <OrderTable initialData={initial} />;
}
