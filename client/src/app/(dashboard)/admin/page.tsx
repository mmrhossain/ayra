import { Suspense } from "react";

import { OrdersStatusBreakdown } from "@/features/dashboard/admin/orders/components/orders-status";
import { fetchOrderList } from "@/features/dashboard/admin/orders/api/orders";
import {
  fetchOrdersByStatus,
  fetchOverview,
  fetchSales,
  fetchTopProducts,
  toErrorMessage,
  type AnalyticsQuery,
  type OverviewMetrics,
} from "@/features/dashboard/admin/overview/api/analytics";
import { AttentionStrip } from "@/features/dashboard/admin/overview/components/attention-strip";
import { DetailedMetrics } from "@/features/dashboard/admin/overview/components/detailed-metrics";
import { KpiGrid } from "@/features/dashboard/admin/overview/components/kpi-grid";
import {
  ChartSkeleton,
  MetricsSkeleton,
  OverviewError,
  WidgetSkeleton,
} from "@/features/dashboard/admin/overview/components/overview-states";
import { RecentOrders } from "@/features/dashboard/admin/overview/components/recent-orders";
import { SalesChart } from "@/features/dashboard/admin/overview/components/sales-chart";
import { TopProductsTable } from "@/features/dashboard/admin/overview/components/top-products";
import { GRANULARITY_BY_RANGE } from "@/features/dashboard/admin/overview/utils/range";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { requireAdminPageAccess, toAdminAccess } from "@/lib/api/auth/server";

const RANGE = "day" as const;

function previousWindow(data: OverviewMetrics) {
  const from = new Date(data.dateFrom).getTime();
  const to = new Date(data.dateTo).getTime();
  const span = to - from + 1;
  return {
    dateFrom: new Date(from - span).toISOString(),
    dateTo: new Date(from - 1).toISOString(),
  };
}

async function HeadlineSection({
  query,
  access,
}: {
  query: AnalyticsQuery;
  access: ReturnType<typeof toAdminAccess>;
}) {
  let data;
  try {
    data = await fetchOverview(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }

  let previous: OverviewMetrics | null = null;
  try {
    previous = await fetchOverview({
      ...query,
      ...previousWindow(data),
    });
  } catch {
    previous = null;
  }

  return (
    <>
      <KpiGrid data={data} previous={previous} />
      <AttentionStrip data={data} access={access} />
    </>
  );
}

async function SalesSection({ query }: { query: AnalyticsQuery }) {
  let sales;
  try {
    sales = await fetchSales(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <SalesChart initialData={sales} initialRange={RANGE} />;
}

async function RecentOrdersSection() {
  let orders;
  try {
    orders = await fetchOrderList({ page: 1, limit: 6 });
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <RecentOrders orders={orders.items} />;
}

async function OrdersStatusSection({ query }: { query: AnalyticsQuery }) {
  let ordersByStatus;
  try {
    ordersByStatus = await fetchOrdersByStatus(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <OrdersStatusBreakdown data={ordersByStatus} />;
}

async function TopProductsSection({ query }: { query: AnalyticsQuery }) {
  let topProducts;
  try {
    topProducts = await fetchTopProducts(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <TopProductsTable data={topProducts} />;
}

async function DetailedSection({ query }: { query: AnalyticsQuery }) {
  let data;
  try {
    data = await fetchOverview(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <DetailedMetrics data={data} />;
}

type Props = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function DashboardOverviewPage({ searchParams }: Props) {
  const { notice } = await searchParams;
  const query: AnalyticsQuery = {
    range: RANGE,
    groupBy: GRANULARITY_BY_RANGE[RANGE],
  };

  const redirectQuery =
    typeof notice === "string" ? `?notice=${encodeURIComponent(notice)}` : "";

  const session = await requireAdminPageAccess("/admin", redirectQuery);
  const access = toAdminAccess(session.user);

  return (
    <section className="min-w-0 space-y-6">
      <PageHeader
        title="Overview"
        description="Store health at a glance. Switch the sales trend between day, month and year."
      />

      <Suspense fallback={<MetricsSkeleton />}>
        <HeadlineSection query={query} access={access} />
      </Suspense>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesSection query={query} />
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          <RecentOrdersSection />
        </Suspense>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Suspense fallback={<WidgetSkeleton />}>
          <OrdersStatusSection query={query} />
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          <TopProductsSection query={query} />
        </Suspense>
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <DetailedSection query={query} />
      </Suspense>
    </section>
  );
}
