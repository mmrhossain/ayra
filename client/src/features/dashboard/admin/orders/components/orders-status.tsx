import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  OrderStatus,
  OrdersByStatusResult,
} from "@/features/dashboard/admin/overview/api/analytics";
import { statusColor } from "@/helpers";

const LABELS: Array<{ status: OrderStatus }> = [
  { status: "PENDING" },
  { status: "CONFIRMED" },
  { status: "PROCESSING" },
  { status: "SHIPPED" },
  { status: "DELIVERED" },
  { status: "CANCELLED" },
];

export function OrdersStatusBreakdown({
  data,
}: {
  data: OrdersByStatusResult;
}) {
  const total = Object.values(data.breakdown).reduce((sum, n) => sum + n, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders by status</CardTitle>
          <CardDescription>Current period breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No orders in this period yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>{total} orders in this period</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {LABELS.map(({ status }) => (
          <span
            key={status}
            className={`inline-flex w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}
          >
            {status}: {data.breakdown[status] || 0}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}
