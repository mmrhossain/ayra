import { OrderDetail } from "@/features/dashboard/customer/orders/components/order-detail";
import {
  fetchMyOrder,
  toCustomerApiError,
} from "@/features/dashboard/customer/orders/api/orders";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchMyOrder(id);
  } catch (err) {
    error = toCustomerApiError(err);
  }

  if (error || !initial) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load order</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return <OrderDetail initialData={initial} />;
}
