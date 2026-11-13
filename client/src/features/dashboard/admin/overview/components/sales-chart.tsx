"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  EyeOff,
  Table2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  fetchSales,
  toErrorMessage,
  type SalesTrend,
} from "@/features/dashboard/admin/overview/api/analytics";
import {
  moneyFormatter,
  NUM,
} from "@/features/dashboard/admin/overview/utils/format";
import {
  GRANULARITY_BY_RANGE,
  type Granularity,
  type RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";
import { cn } from "@/lib/utils";

const chartConfig = {
  netProductSales: { label: "Net product sales", color: "var(--chart-1)" },
  orders: { label: "Delivered orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const compactNumber = new Intl.NumberFormat("en-BD", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatPeriodLabel = (
  dateStr: string,
  granularity: Granularity,
  timeZone: string,
) => {
  const d = new Date(dateStr);
  if (granularity === "year") {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      timeZone,
    }).format(d);
  }
  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone,
    }).format(d);
  }
  if (granularity === "week") {
    return `W/O ${new Intl.DateTimeFormat("en-GB", {
      month: "short",
      day: "numeric",
      timeZone,
    }).format(d)}`;
  }
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(d);
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function PeriodLabel({
  dateFrom,
  dateTo,
  timeZone,
}: {
  dateFrom: string;
  dateTo: string;
  timeZone: string;
}) {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    }).format(new Date(value));
  return (
    <span className="text-xs text-muted-foreground">
      {fmt(dateFrom)} – {fmt(dateTo)}
    </span>
  );
}

type SeriesKey = "sales" | "orders";

const SERIES_META: Record<
  SeriesKey,
  { label: string; dataKey: string; color: string; className: string }
> = {
  sales: {
    label: "Net sales",
    dataKey: "netProductSales",
    color: "var(--chart-1)",
    className: "bg-[var(--chart-1)]",
  },
  orders: {
    label: "Orders",
    dataKey: "orders",
    color: "var(--chart-2)",
    className: "bg-[var(--chart-2)]",
  },
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="truncate text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
        {value}
      </dd>
      {hint ? (
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function SalesChart({
  initialData,
  range,
}: {
  initialData: SalesTrend;
  range: RangeKey;
}) {
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    sales: true,
    orders: true,
  });
  const [showTable, setShowTable] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9-_]/g, "");
  const salesGradient = `sales-fill-${uid}`;
  const ordersGradient = `orders-fill-${uid}`;

  const query = useQuery({
    queryKey: ["admin-sales-trend", range],
    queryFn: () =>
      fetchSales({ range, groupBy: GRANULARITY_BY_RANGE[range] }),
    initialData:
      initialData.groupBy === GRANULARITY_BY_RANGE[range]
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const data = query.data ?? initialData;
  const granularity = (data.groupBy as Granularity) ?? "day";

  const series = useMemo(
    () =>
      data.series.map((point) => ({
        ...point,
        label: formatPeriodLabel(point.period, granularity, data.timezone),
      })),
    [data.series, granularity, data.timezone],
  );

  const stats = useMemo(() => {
    const totalSales = series.reduce((sum, p) => sum + p.netProductSales, 0);
    const totalOrders = series.reduce((sum, p) => sum + p.orders, 0);
    const peak = series.reduce<(typeof series)[number] | null>(
      (best, point) =>
        !best || point.netProductSales > best.netProductSales ? point : best,
      null,
    );
    return {
      totalSales,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      average: series.length > 0 ? totalSales / series.length : 0,
      peak,
    };
  }, [series]);

  const money = moneyFormatter(data.currency);
  const hasVisibleSeries = visible.sales || visible.orders;

  const toggleSeries = (key: SeriesKey) =>
    setVisible((current) => ({ ...current, [key]: !current[key] }));

  const handleExport = () => {
    const header = [
      "Period",
      `Net product sales (${data.currency})`,
      "Delivered orders",
    ];
    const rows = series.map((point) => [
      point.label,
      point.netProductSales,
      point.orders,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-trend-${granularity}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full min-w-0 overflow-hidden">
      <CardHeader className="gap-4 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <TrendingUp className="size-4" />
              </span>
              Sales trend
            </CardTitle>
            <CardDescription>
              Net product sales and delivered orders by {granularity}. Excludes
              shipping and tax; net of returns.
            </CardDescription>
            <PeriodLabel
              dateFrom={data.dateFrom}
              dateTo={data.dateTo}
              timeZone={data.timezone}
            />
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <Stat
            label="Net sales"
            value={money.format(stats.totalSales)}
            hint={`${series.length} ${granularity}${series.length === 1 ? "" : "s"}`}
          />
          <Stat
            label="Orders"
            value={NUM.format(stats.totalOrders)}
            hint="Delivered"
          />
          <Stat
            label="Avg / order"
            value={money.format(stats.avgOrderValue)}
            hint="Net of returns"
          />
        </dl>
      </CardHeader>

      <CardContent className="min-w-0 space-y-3">
        {query.isError ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {toErrorMessage(query.error)}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(SERIES_META) as SeriesKey[]).map((key) => {
            const meta = SERIES_META[key];
            const active = visible[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-border bg-background text-foreground shadow-xs"
                    : "border-border/60 bg-muted/40 text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full",
                    meta.className,
                    !active && "opacity-40",
                  )}
                />
                {meta.label}
                {active ? (
                  <Eye className="size-3 opacity-60" />
                ) : (
                  <EyeOff className="size-3 opacity-60" />
                )}
              </button>
            );
          })}
        </div>

        {series.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No sales in this period yet.
          </p>
        ) : !hasVisibleSeries ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            Select at least one series to display.
          </p>
        ) : (
          <div>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[260px] w-full sm:h-[300px]"
            >
              <AreaChart data={series} accessibilityLayer margin={{ top: 8 }}>
                <defs>
                  <linearGradient id={salesGradient} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-netProductSales)"
                      stopOpacity={0.38}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-netProductSales)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id={ordersGradient} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-orders)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="sales"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value: number) => compactNumber.format(value)}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                  tickFormatter={(value: number) => compactNumber.format(value)}
                />
                {visible.sales && stats.average > 0 ? (
                  <ReferenceLine
                    yAxisId="sales"
                    y={stats.average}
                    stroke="var(--color-netProductSales)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                ) : null}
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name) => {
                        const numeric = Number(value);
                        const isOrders = name === SERIES_META.orders.label;
                        return (
                          <span className="font-mono font-medium tabular-nums">
                            {isOrders
                              ? NUM.format(numeric)
                              : money.format(numeric)}
                          </span>
                        );
                      }}
                    />
                  }
                />
                {visible.sales ? (
                  <Area
                    yAxisId="sales"
                    type="monotone"
                    dataKey="netProductSales"
                    name={SERIES_META.sales.label}
                    stroke="var(--color-netProductSales)"
                    strokeWidth={2}
                    fill={`url(#${salesGradient})`}
                    activeDot={{ r: 4 }}
                    isAnimationActive={!reducedMotion}
                  />
                ) : null}
                {visible.orders ? (
                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name={SERIES_META.orders.label}
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    fill={`url(#${ordersGradient})`}
                    activeDot={{ r: 4 }}
                    isAnimationActive={!reducedMotion}
                  />
                ) : null}
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Dashed line marks the average for the period.
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTable((current) => !current)}
              aria-expanded={showTable}
            >
              {showTable ? (
                <X className="size-4" />
              ) : (
                <Table2 className="size-4" />
              )}
              {showTable ? "Hide table" : "Table"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={series.length === 0}
            >
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </div>

        {showTable ? (
          <div className="max-h-64 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <caption className="sr-only">
                Sales trend data by {granularity}
              </caption>
              <thead className="sticky top-0 bg-muted/60">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Period
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Net sales
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.map((point) => (
                  <tr key={point.period} className="border-t">
                    <th
                      scope="row"
                      className="px-3 py-1.5 text-left font-normal text-muted-foreground"
                    >
                      {point.label}
                    </th>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {money.format(point.netProductSales)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {NUM.format(point.orders)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
