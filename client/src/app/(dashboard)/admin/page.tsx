import { OrdersStatusBreakdown } from "@/features/dashboard/admin/orders/components/orders-status";
import {
  fetchOrdersByStatus,
  fetchOverview,
  fetchSales,
  fetchTopProducts,
  toErrorMessage,
} from "@/features/dashboard/admin/overview/api/analytics";
import { OverviewMetricsGrid } from "@/features/dashboard/admin/overview/components/overview-metrics";
import {
  ChartSkeleton,
  MetricsSkeleton,
  OverviewError,
  WidgetSkeleton,
} from "@/features/dashboard/admin/overview/components/overview-states";
import { SalesChart } from "@/features/dashboard/admin/overview/components/sales-chart";
import { TopProductsTable } from "@/features/dashboard/admin/overview/components/top-products";
import { Suspense } from "react";

export const revalidate = 60;

async function MetricsSection() {
  let overview;
  try {
    overview = await fetchOverview();
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <OverviewMetricsGrid data={overview} />;
}

async function SalesSection() {
  let sales;
  try {
    sales = await fetchSales("day");
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }

  return <SalesChart initialData={sales} />;
}

async function OrdersStatusSection() {
  let ordersByStatus;
  try {
    ordersByStatus = await fetchOrdersByStatus();
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <OrdersStatusBreakdown data={ordersByStatus} />;
}

async function TopProductsSection() {
  let topProducts;
  try {
    topProducts = await fetchTopProducts();
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <TopProductsTable data={topProducts} />;
}

export default function DashboardOverviewPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live store metrics from the last reporting period.
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <MetricsSection />
        </Suspense>

        {/* Only this section will update and show skeleton when toggled */}
        <Suspense fallback={<ChartSkeleton />}>
          <SalesSection />
        </Suspense>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<WidgetSkeleton />}>
            <OrdersStatusSection />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <TopProductsSection />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
