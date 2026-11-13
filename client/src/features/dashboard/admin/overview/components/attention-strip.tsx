import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  RotateCcw,
} from "lucide-react";

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

export function AttentionStrip({
  data,
  access,
}: {
  data: OverviewMetrics;
  access: AdminAccess;
}) {
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

  const columns =
    actionable.length >= 3
      ? "sm:grid-cols-2 xl:grid-cols-3"
      : actionable.length === 2
        ? "sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <div
      role="group"
      aria-label="Operational queues with open items"
      className={`grid gap-2.5 ${columns}`}
    >
      {actionable.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <item.icon className={`size-4 shrink-0 ${item.tone}`} />
            <span className="truncate text-sm font-medium">{item.label}</span>
          </span>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums">
            {data[item.key]}
          </span>
        </Link>
      ))}
    </div>
  );
}
