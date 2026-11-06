import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  PackageCheck,
  PiggyBank,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { OverviewMetrics } from "@/features/dashboard/admin/overview/api/analytics";
import {
  formatDelta,
  percentChange,
} from "@/features/dashboard/admin/overview/utils/delta";
import { formatMetric } from "@/features/dashboard/admin/overview/utils/format";

type Kpi = {
  label: string;
  value: number;
  format: "money" | "count";
  previous: number | null;
  note?: string;
  invertDelta?: boolean;
  icon: LucideIcon;
  accent: string;
  glow: string;
};

export function KpiGrid({
  data,
  previous,
}: {
  data: OverviewMetrics;
  previous: OverviewMetrics | null;
}) {
  const kpis: Kpi[] = [
    {
      label: "Net product sales",
      value: data.netProductSales,
      format: "money",
      previous: previous?.netProductSales ?? null,
      icon: TrendingUp,
      accent: "text-primary",
      glow: "from-primary/15",
    },
    {
      label: "Estimated gross profit",
      value: data.estimatedGrossProfit,
      format: "money",
      previous: previous?.estimatedGrossProfit ?? null,
      note: `${data.estimatedGrossMarginPercent.toFixed(1)}% margin · cost data ${data.costCoveragePercent.toFixed(0)}% complete`,
      icon: PiggyBank,
      accent: "text-emerald-600 dark:text-emerald-400",
      glow: "from-emerald-500/15",
    },
    {
      label: "Delivered orders",
      value: data.totalOrders,
      format: "count",
      previous: previous?.totalOrders ?? null,
      icon: PackageCheck,
      accent: "text-sky-600 dark:text-sky-400",
      glow: "from-sky-500/15",
    },
    {
      label: "Outstanding COD",
      value: data.outstandingCod,
      format: "money",
      previous: previous?.outstandingCod ?? null,
      invertDelta: true,
      icon: Banknote,
      accent: "text-amber-600 dark:text-amber-400",
      glow: "from-amber-500/15",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {new Date(data.dateFrom).toLocaleDateString("en-GB", {
          timeZone: data.timezone,
        })}{" "}
        to{" "}
        {new Date(data.dateTo).toLocaleDateString("en-GB", {
          timeZone: data.timezone,
        })}
        . Sales use delivery date; returns use approval date; cash uses payment
        and refund dates.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const delta = percentChange(kpi.value, kpi.previous);
          const good =
            delta !== null && (kpi.invertDelta ? delta <= 0 : delta >= 0);
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              data-slot="kpi-card"
              className="group relative overflow-hidden transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${kpi.glow} to-transparent opacity-70`}
              />
              <CardContent className="relative space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg bg-background/80 ring-1 ring-border/70 ${kpi.accent}`}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                  {formatMetric(kpi.value, kpi.format, data.currency)}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {delta !== null && delta !== 0 ? (
                    delta > 0 ? (
                      <ArrowUpRight
                        className={`size-3.5 ${
                          good ? "text-emerald-600" : "text-destructive"
                        }`}
                      />
                    ) : (
                      <ArrowDownRight
                        className={`size-3.5 ${
                          good ? "text-emerald-600" : "text-destructive"
                        }`}
                      />
                    )
                  ) : null}
                  <span className="tabular-nums">{formatDelta(delta)}</span>
                  <span>vs previous period</span>
                </p>
                {kpi.note ? (
                  <p className="text-xs text-muted-foreground">{kpi.note}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!data.costDataComplete ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Buying cost is missing for some sold items. Known COGS covers{" "}
            <span className="font-semibold tabular-nums">
              {data.costCoveragePercent.toFixed(1)}%
            </span>{" "}
            of net product sales, so estimated gross profit is incomplete.
            {data.costMissingLines > 0
              ? ` ${data.costMissingLines} sold line(s) have no buying cost.`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
