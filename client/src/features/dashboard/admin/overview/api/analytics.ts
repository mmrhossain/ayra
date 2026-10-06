import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type OverviewMetrics = {
  totalRevenue: number;
  totalOrders: number;
  pendingPaymentsCount: number;
  lowStockCount: number;
  newCustomersCount: number;
  averageOrderValue: number;
  dateFrom: string;
  dateTo: string;
};

export type SalesPoint = {
  period: string;
  revenue: number;
  orders: number;
};

export type SalesTrend = {
  groupBy: string;
  dateFrom: string;
  dateTo: string;
  series: SalesPoint[];
};

export type TopProduct = {
  sku: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type TopProductsResult = {
  sortBy: string;
  dateFrom: string;
  dateTo: string;
  products: TopProduct[];
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrdersByStatusResult = {
  dateFrom: string;
  dateTo: string;
  breakdown: Record<OrderStatus, number>;
};

const noStore = { cache: "no-store" as const };

export async function fetchOverview() {
  const res = await dashboardApi.get<Envelope<OverviewMetrics>>(
    "/admin/analytics/overview",
    noStore
  );
  return res.data;
}

export async function fetchSales(groupBy: "day" | "week" | "month" = "day") {
  const res = await dashboardApi.get<Envelope<SalesTrend>>("/admin/analytics/sales", {
    ...noStore,
    params: { groupBy },
  });
  return res.data;
}

export async function fetchOrdersByStatus() {
  const res = await dashboardApi.get<Envelope<OrdersByStatusResult>>(
    "/admin/analytics/orders-by-status",
    noStore
  );
  return res.data;
}

export async function fetchTopProducts() {
  const res = await dashboardApi.get<Envelope<TopProductsResult>>("/admin/analytics/top-products", {
    ...noStore,
    params: { limit: 8, sortBy: "revenue" },
  });
  return res.data;
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
