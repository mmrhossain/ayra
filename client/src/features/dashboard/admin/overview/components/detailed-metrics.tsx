import {
  Banknote,
  Boxes,
  ChevronDown,
  CreditCard,
  PackageCheck,
  Percent,
  PiggyBank,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { OverviewMetrics } from "@/features/dashboard/admin/overview/api/analytics";
import {
  formatMetric,
  type MetricFormat,
} from "@/features/dashboard/admin/overview/utils/format";

type MetricKey = Exclude<
  {
    [K in keyof OverviewMetrics]: OverviewMetrics[K] extends number ? K : never;
  }[keyof OverviewMetrics],
  "netProductSales" | "estimatedGrossProfit" | "totalOrders" | "outstandingCod"
>;

type Metric = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
  hint?: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
};

const GROUPS: Array<{ heading: string; metrics: Metric[] }> = [
  {
    heading: "Revenue",
    metrics: [
      {
        key: "grossProductSales",
        label: "Gross product sales",
        format: "money",
        hint: "Line prices before discounts, tax, returns and shipping.",
        icon: ShoppingBag,
        accent: "text-primary",
        glow: "from-primary/15",
      },
      {
        key: "productDiscounts",
        label: "Product discounts",
        format: "money",
        hint: "Coupon discount allocated to product lines. Excludes free shipping.",
        icon: Tag,
        accent: "text-rose-600 dark:text-rose-400",
        glow: "from-rose-500/15",
      },
      {
        key: "salesReversed",
        label: "Sales reversed by returns",
        format: "money",
        hint: "Net product sales reversed by returns approved in this period.",
        icon: RotateCcw,
        accent: "text-orange-600 dark:text-orange-400",
        glow: "from-orange-500/15",
      },
      {
        key: "taxAmount",
        label: "Tax",
        format: "money",
        hint: "Tax included in prices or added, depending on the order snapshot.",
        icon: Receipt,
        accent: "text-slate-600 dark:text-slate-300",
        glow: "from-slate-500/15",
      },
      {
        key: "averageOrderValue",
        label: "Net sales per delivered order",
        format: "money",
        hint: "Net product sales divided by delivered orders.",
        icon: TrendingUp,
        accent: "text-teal-600 dark:text-teal-400",
        glow: "from-teal-500/15",
      },
    ],
  },
  {
    heading: "Cost & profit",
    metrics: [
      {
        key: "estimatedGrossMarginPercent",
        label: "Estimated gross margin",
        format: "percent",
        hint: "Estimated gross profit as a share of net product sales.",
        icon: Percent,
        accent: "text-emerald-600 dark:text-emerald-400",
        glow: "from-emerald-500/15",
      },
      {
        key: "knownCogs",
        label: "Known COGS",
        format: "money",
        hint: "Cost snapshots at sale time, net of resalable return cost reversals.",
        icon: PiggyBank,
        accent: "text-amber-600 dark:text-amber-400",
        glow: "from-amber-500/15",
      },
    ],
  },
  {
    heading: "Shipping",
    metrics: [
      {
        key: "netShippingIncome",
        label: "Net shipping income",
        format: "money",
        hint: "Shipping charged minus shipping refunded on full returns.",
        icon: Truck,
        accent: "text-sky-600 dark:text-sky-400",
        glow: "from-sky-500/15",
      },
      {
        key: "shippingExpense",
        label: "Shipping expense",
        format: "money",
        hint: "Courier cost recorded on shipments for orders delivered in the period.",
        icon: Boxes,
        accent: "text-indigo-600 dark:text-indigo-400",
        glow: "from-indigo-500/15",
      },
      {
        key: "netShippingResult",
        label: "Net shipping result",
        format: "money",
        hint: "Shipping charged minus shipping refunded and courier expense.",
        icon: PackageCheck,
        accent: "text-violet-600 dark:text-violet-400",
        glow: "from-violet-500/15",
      },
    ],
  },
  {
    heading: "Operations & cash",
    metrics: [
      {
        key: "cashCollected",
        label: "Cash collected",
        format: "money",
        hint: "Payments received in the period, by payment date.",
        icon: Wallet,
        accent: "text-emerald-600 dark:text-emerald-400",
        glow: "from-emerald-500/15",
      },
      {
        key: "cashRefunded",
        label: "Cash refunded",
        format: "money",
        hint: "Completed refunds in the period, by completion date.",
        icon: RotateCcw,
        accent: "text-rose-600 dark:text-rose-400",
        glow: "from-rose-500/15",
      },
      {
        key: "netCash",
        label: "Net cash movement",
        format: "money",
        hint: "Cash collected minus completed cash refunds.",
        icon: Banknote,
        accent: "text-primary",
        glow: "from-primary/15",
      },
      {
        key: "pendingRefundsCount",
        label: "Open refunds",
        format: "count",
        hint: "Refunds created in this period still pending, approved or processing.",
        icon: RotateCcw,
        accent: "text-amber-600 dark:text-amber-400",
        glow: "from-amber-500/15",
      },
      {
        key: "pendingPaymentsCount",
        label: "Pending payments",
        format: "count",
        hint: "Payments currently pending or initiated for this currency.",
        icon: CreditCard,
        accent: "text-sky-600 dark:text-sky-400",
        glow: "from-sky-500/15",
      },
      {
        key: "lowStockCount",
        label: "Low stock",
        format: "count",
        hint: "Inventory rows below the configured threshold.",
        icon: Boxes,
        accent: "text-orange-600 dark:text-orange-400",
        glow: "from-orange-500/15",
      },
      {
        key: "newCustomersCount",
        label: "New customers",
        format: "count",
        hint: "Customer profiles created in the period.",
        icon: Users,
        accent: "text-teal-600 dark:text-teal-400",
        glow: "from-teal-500/15",
      },
    ],
  },
];

function DetailedMetricCard({
  metric,
  value,
  currency,
}: {
  metric: Metric;
  value: number;
  currency: string;
}) {
  const Icon = metric.icon;
  return (
    <Card
      data-slot="detailed-metric-card"
      className="group relative min-w-0 overflow-hidden transition-shadow hover:shadow-md"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${metric.glow} to-transparent opacity-70`}
      />
      <CardContent className="relative space-y-2 pt-4 sm:space-y-3 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
            {metric.label}
          </p>
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg bg-background/80 ring-1 ring-border/70 ${metric.accent}`}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl lg:text-3xl">
          {formatMetric(value, metric.format, currency)}
        </p>
        {metric.hint ? (
          <p className="text-xs leading-snug text-muted-foreground">
            {metric.hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DetailedMetrics({ data }: { data: OverviewMetrics }) {
  return (
    <details className="group min-w-0 rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>Detailed accounting metrics</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="min-w-0 space-y-5 border-t p-3 sm:p-4">
        {GROUPS.map((group) => (
          <div key={group.heading} className="min-w-0 space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.heading}
            </h3>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {group.metrics.map((metric) => (
                <DetailedMetricCard
                  key={metric.key}
                  metric={metric}
                  value={data[metric.key]}
                  currency={data.currency}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
