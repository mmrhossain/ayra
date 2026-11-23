import { AlertTriangle, CheckCircle2, CreditCard, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import type { OverviewMetrics } from "@/features/dashboard/admin/overview/api/analytics";
import { canAccessAdminPath } from "@/lib/admin-navigation";
import type { AdminAccess } from "@/lib/admin-permissions";

const ITEMS = [
  {
    href: "/admin/refunds",
    icon: RotateCcw,
    label: "Open refunds",
    key: "pendingRefundsCount" as const,
    tone: "text-destructive",
  },
  {
    href: "/admin/inventory",
    icon: AlertTriangle,
    label: "Low stock variants",
    key: "lowStockCount" as const,
    tone: "text-amber-600",
  },
  {
    href: "/admin/payments",
    icon: CreditCard,
    label: "Payments pending",
    key: "pendingPaymentsCount" as const,
    tone: "text-sky-600",
  },
];

const QUEUE_CARD =
  "flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5";
const QUEUE_LABEL = "flex min-w-0 items-center gap-2.5";
const QUEUE_COUNT = "size-6 shrink-0 rounded-full";

function queueGrid(count: number) {
  const columns =
    count >= 3 ? "sm:grid-cols-2 xl:grid-cols-3" : count === 2 ? "sm:grid-cols-2" : "grid-cols-1";
  return `grid gap-2.5 ${columns}`;
}

export function AttentionStripSkeleton() {
  return (
    <div aria-hidden="true" className={queueGrid(2)}>
      {[1, 2].map((item) => (
        <div key={item} className={QUEUE_CARD}>
          <div className={QUEUE_LABEL}>
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-4 w-28 max-w-full" />
          </div>
          <Skeleton className={QUEUE_COUNT} />
        </div>
      ))}
    </div>
  );
}

export function AttentionStrip({ data, access }: { data: OverviewMetrics; access: AdminAccess }) {
  const visible = ITEMS.filter((item) => canAccessAdminPath(access, item.href));

  if (visible.length === 0) return null;
  const actionable = visible.filter((item) => data[item.key] > 0);

  if (actionable.length === 0) {
    return (
      <p
        role="status"
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-muted-foreground"
      >
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        All clear — no open items in the queues you can access.
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Operational queues with open items"
      className={queueGrid(actionable.length)}
    >
      {actionable.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${QUEUE_CARD} transition-colors hover:bg-accent`}
        >
          <span className={QUEUE_LABEL}>
            <item.icon className={`size-4 shrink-0 ${item.tone}`} />
            <span className="truncate text-sm font-medium">{item.label}</span>
          </span>
          <span
            className={`grid ${QUEUE_COUNT} place-items-center bg-muted text-xs font-semibold tabular-nums`}
          >
            {data[item.key]}
          </span>
        </Link>
      ))}
    </div>
  );
}
