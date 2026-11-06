import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  customerLabel,
  money,
  statusVariantFor,
  type OrderListItem,
} from "@/features/dashboard/admin/orders/api/orders";
import { StatusBadge } from "@/components/ui/status-badge";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const formatOrderTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
};

function OrderRow({ order }: { order: OrderListItem }) {
  const itemCount = order.itemCount ?? 0;
  return (
    <li>
      <Link
        href={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
        className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Package className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">
              {customerLabel(order)}
            </span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
              {order.orderNumber}
            </span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatOrderTime(order.createdAt)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <span className="max-w-[10rem] truncate font-mono text-xs sm:hidden">
              {order.orderNumber}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-between">
          <span className="text-sm font-semibold tabular-nums">
            {money(order.grandTotal)}
          </span>
          <StatusBadge variant={statusVariantFor(order.status)}>
            {order.status.replaceAll("_", " ")}
          </StatusBadge>
        </span>
      </Link>
    </li>
  );
}

export function RecentOrders({ orders }: { orders: OrderListItem[] }) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader className="pb-2">
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest activity across the store.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/admin/orders">
              View all
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-0">
        {orders.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
