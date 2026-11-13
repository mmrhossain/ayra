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
import { OverviewRangeFilter } from "@/features/dashboard/admin/overview/components/overview-range-filter";
import {
  ChartSkeleton,
  DetailedMetricsSkeleton,
  HeadlineSkeleton,
  OrdersStatusSkeleton,
  RecentOrdersSkeleton,
  TopProductsSkeleton,
  OverviewError,
} from "@/features/dashboard/admin/overview/components/overview-states";
import { RecentOrders } from "@/features/dashboard/admin/overview/components/recent-orders";
import { SalesChart } from "@/features/dashboard/admin/overview/components/sales-chart";
import { TopProductsTable } from "@/features/dashboard/admin/overview/components/top-products";
import {
  GRANULARITY_BY_RANGE,
  RANGE_KEYS,
  type RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { requireAdminPageAccess, toAdminAccess } from "@/lib/api/auth/server";

function isRangeKey(value: string): value is RangeKey {
  return RANGE_KEYS.some((range) => range === value);
}

function previousWindow(data: OverviewMetrics) {
  const from = new Date(data.dateFrom).getTime();
  const to = new Date(data.dateTo).getTime();
  const span = to - from + 1;
  return {
    dateFrom: new Date(from - span).toISOString(),
    dateTo: new Date(from - 1).toISOString(),
  };
}

async function PreviousHeadlineKpis({
  query,
  data,
}: {
  query: AnalyticsQuery;
  data: OverviewMetrics;
}) {
  let previous: OverviewMetrics | null = null;
  try {
    previous = await fetchOverview({
      ...query,
      ...previousWindow(data),
    });
  } catch {
    previous = null;
  }

  return <KpiGrid data={data} previous={previous} />;
}

async function HeadlineSection({
  query,
  overview,
  access,
}: {
  query: AnalyticsQuery;
  overview: Promise<OverviewMetrics>;
  access: ReturnType<typeof toAdminAccess>;
}) {
  let data;
  try {
    data = await overview;
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }

  return (
    <>
      <Suspense fallback={<KpiGrid data={data} previous={null} />}>
        <PreviousHeadlineKpis query={query} data={data} />
      </Suspense>
      <AttentionStrip data={data} access={access} />
    </>
  );
}

async function SalesSection({
  query,
  range,
}: {
  query: AnalyticsQuery;
  range: RangeKey;
}) {
  let sales;
  try {
    sales = await fetchSales(query);
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <SalesChart initialData={sales} range={range} />;
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

async function DetailedSection({
  overview,
}: {
  overview: Promise<OverviewMetrics>;
}) {
  let data;
  try {
    data = await overview;
  } catch (err) {
    return <OverviewError message={toErrorMessage(err)} />;
  }
  return <DetailedMetrics data={data} />;
}

type Props = {
  searchParams: Promise<{
    notice?: string | string[];
    range?: string | string[];
  }>;
};

export default async function AdminOverviewPage({ searchParams }: Props) {
  const { notice, range: requestedRange } = await searchParams;
  const range =
    typeof requestedRange === "string" && isRangeKey(requestedRange)
      ? requestedRange
      : "day";
  const query: AnalyticsQuery = {
    range,
    groupBy: GRANULARITY_BY_RANGE[range],
  };

  const redirectQuery =
    typeof notice === "string" ? `?notice=${encodeURIComponent(notice)}` : "";

  const session = await requireAdminPageAccess("/admin", redirectQuery);
  const access = toAdminAccess(session.user);
  const overview = fetchOverview(query);

  return (
    <section className="min-w-0 space-y-6">
      <PageHeader
        title="Overview"
        description="Sales and growth for the selected period, with current operational queues."
        actions={<OverviewRangeFilter />}
      />

      <Suspense fallback={<HeadlineSkeleton />}>
        <HeadlineSection query={query} overview={overview} access={access} />
      </Suspense>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesSection query={query} range={range} />
        </Suspense>

        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrdersSection />
        </Suspense>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Suspense fallback={<OrdersStatusSkeleton />}>
          <OrdersStatusSection query={query} />
        </Suspense>

        <Suspense fallback={<TopProductsSkeleton />}>
          <TopProductsSection query={query} />
        </Suspense>
      </div>

      <Suspense fallback={<DetailedMetricsSkeleton />}>
        <DetailedSection overview={overview} />
      </Suspense>
    </section>
  );
}
