import Link from "next/link";
import { AlertTriangle, CreditCard, RotateCcw, Users } from "lucide-react";

import type { OverviewMetrics } from "@/features/dashboard/admin/overview/api/analytics";
import { canAccessAdminPath } from "@/lib/admin-navigation";
import type { AdminAccess } from "@/lib/admin-permissions";

const ITEMS = [
  {
    href: "/admin/refunds",
    icon: RotateCcw,
    label: "Refunds awaiting review",
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
  {
    href: "/admin/users",
    icon: Users,
    label: "New customers",
    key: "newCustomersCount" as const,
    tone: "text-emerald-600",
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
        >
          <item.icon className={`size-5 shrink-0 ${item.tone}`} />
          <span className="flex min-w-0 flex-col">
            <span className="text-lg font-semibold tabular-nums">
              {data[item.key]}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {item.label}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
