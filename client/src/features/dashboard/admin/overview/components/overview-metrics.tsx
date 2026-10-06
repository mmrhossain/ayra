import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OverviewMetrics } from "@/features/dashboard/admin/overview/api/analytics";

const BDT = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-BD");

const CARDS: Array<{
  key: keyof OverviewMetrics;
  label: string;
  format: "money" | "count";
}> = [
  { key: "totalRevenue", label: "Total revenue", format: "money" },
  { key: "totalOrders", label: "Total orders", format: "count" },
  { key: "averageOrderValue", label: "Average order value", format: "money" },
  { key: "pendingPaymentsCount", label: "Pending payments", format: "count" },
  { key: "lowStockCount", label: "Low stock", format: "count" },
  { key: "newCustomersCount", label: "New customers", format: "count" },
];

export function OverviewMetricsGrid({ data }: { data: OverviewMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((card) => {
        const value = data[card.key];
        const display =
          typeof value === "number"
            ? card.format === "money"
              ? BDT.format(value)
              : NUM.format(value)
            : String(value);
        return (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {display}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
