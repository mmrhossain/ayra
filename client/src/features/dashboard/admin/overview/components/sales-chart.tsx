"use client";

import { useState, useTransition } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSales, type SalesTrend } from "@/features/dashboard/admin/overview/api/analytics";

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const formatPeriodLabel = (dateStr: string, groupBy: "day" | "week" | "month") => {
  const d = new Date(dateStr);
  if (groupBy === "month") {
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(d);
  }
  if (groupBy === "week") {
    return `W/O ${new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(d)}`;
  }
  return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(d);
};

export function SalesChart({ initialData }: { initialData: SalesTrend }) {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<SalesTrend>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleGroupByChange = (newItem: "day" | "week" | "month") => {
    setGroupBy(newItem);
    startTransition(async () => {
      try {
        const newData = await fetchSales(newItem);
        setData(newData);
      } catch (err) {
        console.error("Failed to fetch sales data", err);
      }
    });
  };

  const series = data.series.map((point) => ({
    ...point,
    label: formatPeriodLabel(point.period, groupBy),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Sales trend</CardTitle>
          <CardDescription>Revenue and orders grouped by {groupBy}</CardDescription>
        </div>
        {/* Group By Selection Controls */}
        <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
          {(["day", "week", "month"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={groupBy === item ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 capitalize"
              disabled={isPending}
              onClick={() => handleGroupByChange(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="h-[180px] w-full flex items-end justify-between gap-3 pt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton
                  className="w-full rounded-t-sm"
                  style={{ height: `${[40, 65, 30, 85, 50, 75, 60, 90, 45, 70, 55, 80][i]}%` }}
                />
                <Skeleton className="h-3 w-7" />
              </div>
            ))}
          </div>
        ) : series.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No sales in this period yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <LineChart data={series} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--color-orders)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
