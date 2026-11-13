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

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  SHIPPED: "bg-sky-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
};

const statusLabel = (status: OrderStatus) =>
  `${status[0]}${status.slice(1).toLowerCase()}`;

export function OrdersStatusBreakdown({
  data,
}: {
  data: OrdersByStatusResult;
}) {
  const total = Object.values(data.breakdown).reduce((sum, n) => sum + n, 0);

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>
          {total === 0 ? "No orders in this period yet." : `${total} orders in this period`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STATUSES.map((status) => {
          const count = data.breakdown[status] || 0;
          const share = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status} className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium">{statusLabel(status)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {count} · {share}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${statusLabel(status)} orders`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={`h-full rounded-full transition-[width] ${STATUS_TONES[status]}`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
