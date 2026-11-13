import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";
import type { Envelope } from "@/lib/api/http";
import type {
  Granularity,
  RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";

export type { Envelope, Granularity, RangeKey };

export type AnalyticsQuery = {
  range?: RangeKey;
  groupBy?: Granularity;
  dateFrom?: string;
  dateTo?: string;
};

export type CurrencyCode = "BDT" | "USD";

export type OverviewMetrics = {
  currency: CurrencyCode;
  timezone: string;
  generatedAt: string;
  reportingBasis: {
    sales: string;
    returns: string;
    cash: string;
    cogs: string;
  };
  grossProductSales: number;
  productDiscounts: number;
  taxAmount: number;
  netProductSales: number;
  salesReversed: number;
  shippingIncome: number;
  shippingRefunded: number;
  netShippingIncome: number;
  shippingExpense: number;
  netShippingResult: number;
  knownCogs: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercent: number;
  costCoveragePercent: number;
  costDataComplete: boolean;
  costMissingLines: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingPaymentsCount: number;
  lowStockCount: number;
  newCustomersCount: number;
  totalRefunded: number;
  pendingRefundsCount: number;
  cashCollected: number;
  cashRefunded: number;
  netCash: number;
  outstandingCod: number;
  returnedQuantity: number;
  dateFrom: string;
  dateTo: string;
};

export type SalesPoint = {
  period: string;
  grossProductSales: number;
  productDiscounts: number;
  taxAmount: number;
  salesReversed: number;
  netProductSales: number;
  orders: number;
};

export type SalesTrend = {
  currency: CurrencyCode;
  timezone: string;
  groupBy: string;
  dateFrom: string;
  dateTo: string;
  series: SalesPoint[];
};

export type TopProduct = {
  sku: string;
  productName: string;
  quantitySold: number;
  quantityReturned: number;
  netQuantity: number;
  grossProductSales: number;
  productDiscounts: number;
  netProductSales: number;
  knownCogs: number;
  estimatedGrossProfit: number;
  costCoveragePercent: number;
  costDataComplete: boolean;
};

export type TopProductsResult = {
  currency: CurrencyCode;
  timezone: string;
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
  currency: CurrencyCode;
  timezone: string;
  dateFrom: string;
  dateTo: string;
  breakdown: Record<OrderStatus, number>;
};

const noStore = { cache: "no-store" as const };

export async function fetchOverview(query: AnalyticsQuery = {}) {
  const res = await dashboardApi.get<Envelope<OverviewMetrics>>(
    "/admin/analytics/overview",
    { ...noStore, params: query },
  );
  return res.data;
}

export async function fetchSales(query: AnalyticsQuery = {}) {
  const res = await dashboardApi.get<Envelope<SalesTrend>>(
    "/admin/analytics/sales",
    { ...noStore, params: query },
  );
  return res.data;
}

export async function fetchOrdersByStatus(query: AnalyticsQuery = {}) {
  const res = await dashboardApi.get<Envelope<OrdersByStatusResult>>(
    "/admin/analytics/orders-by-status",
    { ...noStore, params: query },
  );
  return res.data;
}

export async function fetchTopProducts(query: AnalyticsQuery = {}) {
  const res = await dashboardApi.get<Envelope<TopProductsResult>>(
    "/admin/analytics/top-products",
    { ...noStore, params: { limit: 8, sortBy: "revenue", ...query } },
  );
  return res.data;
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
