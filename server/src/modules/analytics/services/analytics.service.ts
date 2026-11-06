import { prisma } from "../../../lib/prisma.ts";
import { redisGet, redisSet } from "../../../lib/redis.ts";
import type {
  OrdersByStatusQuery,
  OverviewQuery,
  SalesQuery,
  TopProductsQuery,
} from "../types.ts";
import {
  lineAmountsForRange,
  resolveLineTotals,
  toMinor,
} from "../../order/utils/order-helpers.ts";
import { DHAKA_OFFSET_MINUTES, DHAKA_TIME_ZONE } from "../utils/dhaka-time.ts";

const CACHE_TTL_SECONDS = 5 * 60;
const DHAKA_OFFSET_MS = DHAKA_OFFSET_MINUTES * 60 * 1000;

const round2 = (value: number): number => Math.round(value * 100) / 100;
const money = (minor: number): number => round2(minor / 100);
const percent = (part: number, total: number): number =>
  total > 0 ? round2((part / total) * 100) : 0;

const cacheKey = (parts: Array<string | number>) =>
  `analytics:${parts.join(":")}`;

const iso = (d: Date) =>
  new Date(Math.floor(d.getTime() / 60_000) * 60_000).toISOString();

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "test") {
    const hit = await redisGet(key);
    if (hit) {
      try {
        return JSON.parse(hit) as T;
      } catch {
        // fall through to DB
      }
    }
  }

  const data = await loader();

  if (process.env.NODE_ENV !== "test") {
    await redisSet(key, JSON.stringify(data), CACHE_TTL_SECONDS);
  }

  return data;
}

type SalesOrder = Awaited<ReturnType<typeof loadSalesOrders>>[number];

const loadSalesOrders = (
  dateFrom: Date,
  dateTo: Date,
  currency: "BDT" | "USD",
) =>
  prisma.order.findMany({
    where: {
      deletedAt: null,
      currency,
      deliveredAt: { gte: dateFrom, lte: dateTo },
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      currency: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      shippingAmount: true,
      grandTotal: true,
      pricesIncludeTax: true,
      deliveredAt: true,
      items: {
        select: {
          sku: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          costPrice: true,
          discountAmount: true,
          taxAmount: true,
          allocationVersion: true,
        },
      },
      payments: {
        select: { method: true, status: true },
      },
      shipments: {
        select: { shippingCost: true },
      },
    },
  });

type SaleRecord = {
  currency: "BDT" | "USD";
  sku: string;
  productName: string;
  quantity: number;
  grossMinor: number;
  discountMinor: number;
  taxMinor: number;
  netSalesMinor: number;
  costMinor: number | null;
  costKnown: boolean;
  occurredAt: Date;
};

const saleRecords = (orders: SalesOrder[]): SaleRecord[] => {
  const records: SaleRecord[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const totals = resolveLineTotals(order, item);
      const grossMinor = toMinor(item.unitPrice) * item.quantity;
      const netSalesMinor =
        grossMinor -
        totals.discountMinor -
        (order.pricesIncludeTax ? totals.taxMinor : 0);
      const costKnown = item.costPrice !== null && item.costPrice !== undefined;
      records.push({
        currency: order.currency,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        grossMinor,
        discountMinor: totals.discountMinor,
        taxMinor: totals.taxMinor,
        netSalesMinor,
        costMinor: costKnown ? toMinor(item.costPrice!) * item.quantity : null,
        costKnown,
        occurredAt: order.deliveredAt!,
      });
    }
  }
  return records;
};

type ReturnRecord = {
  currency: "BDT" | "USD";
  sku: string;
  productName: string;
  quantity: number;
  salesMinor: number;
  costMinor: number;
  costKnown: boolean;
  costReversalApplicable: boolean;
  occurredAt: Date;
};

const loadApprovedReturns = async (
  dateFrom: Date,
  dateTo: Date,
  currency: "BDT" | "USD",
) => {
  // Legacy approvals have no snapshot, so prior approved quantities on the same
  // line are needed to reproduce the cumulative pro-rata reversal. Load all
  // approved rows for the currency and filter the reporting window in memory.
  const rows = await prisma.returnItem.findMany({
    where: {
      returnRequest: {
        status: "APPROVED",
        order: { deletedAt: null, currency },
      },
    },
    select: {
      id: true,
      orderItemId: true,
      quantity: true,
      restockToStock: true,
      damaged: true,
      salesAdjustmentAmount: true,
      costAdjustmentAmount: true,
      allocationVersion: true,
      createdAt: true,
      returnRequest: {
        select: { id: true, reviewedAt: true, requestedAt: true, status: true },
      },
      orderItem: {
        select: {
          quantity: true,
          unitPrice: true,
          costPrice: true,
          discountAmount: true,
          taxAmount: true,
          allocationVersion: true,
          sku: true,
          productName: true,
          order: {
            select: {
              subtotal: true,
              discountAmount: true,
              taxAmount: true,
              pricesIncludeTax: true,
            },
          },
        },
      },
    },
  });

  const previousByLine = new Map<string, number>();
  const records: ReturnRecord[] = [];
  let shippingRefundedMinor = 0;
  const sorted = [...rows].sort((a, b) => {
    const aAt = a.returnRequest.reviewedAt ?? a.returnRequest.requestedAt;
    const bAt = b.returnRequest.reviewedAt ?? b.returnRequest.requestedAt;
    return (
      aAt.getTime() - bAt.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  });

  for (const row of sorted) {
    const previous = previousByLine.get(row.orderItemId) ?? 0;
    const amounts = lineAmountsForRange(
      row.orderItem.order,
      row.orderItem,
      previous,
      row.quantity,
    );
    previousByLine.set(row.orderItemId, previous + row.quantity);

    const reviewedAt =
      row.returnRequest.reviewedAt ?? row.returnRequest.requestedAt;
    if (
      reviewedAt.getTime() < dateFrom.getTime() ||
      reviewedAt.getTime() > dateTo.getTime()
    ) {
      continue;
    }

    const resalable = row.restockToStock && !row.damaged;
    const costKnown =
      row.orderItem.costPrice !== null && row.orderItem.costPrice !== undefined;
    records.push({
      currency,
      sku: row.orderItem.sku,
      productName: row.orderItem.productName,
      quantity: row.quantity,
      salesMinor:
        row.allocationVersion >= 1
          ? toMinor(row.salesAdjustmentAmount)
          : amounts.netSalesMinor,
      costMinor:
        row.allocationVersion >= 1
          ? resalable
            ? toMinor(row.costAdjustmentAmount)
            : 0
          : resalable
            ? (amounts.costMinor ?? 0)
            : 0,
      costKnown,
      costReversalApplicable: resalable,
      occurredAt: reviewedAt,
    });
  }

  const shippingRows = await prisma.returnRequest.findMany({
    where: {
      status: "APPROVED",
      reviewedAt: { gte: dateFrom, lte: dateTo },
      order: { deletedAt: null, currency },
    },
    select: { shippingRefundAmount: true },
  });
  for (const row of shippingRows) {
    shippingRefundedMinor += toMinor(row.shippingRefundAmount);
  }

  return { records, shippingRefundedMinor };
};

const dhakaBucket = (date: Date, groupBy: SalesQuery["groupBy"]): Date => {
  const local = new Date(date.getTime() + DHAKA_OFFSET_MS);
  if (groupBy === "year") {
    local.setUTCMonth(0);
    local.setUTCDate(1);
    local.setUTCHours(0, 0, 0, 0);
  } else if (groupBy === "month") {
    local.setUTCDate(1);
    local.setUTCHours(0, 0, 0, 0);
  } else if (groupBy === "week") {
    local.setUTCHours(0, 0, 0, 0);
    const daysSinceMonday = (local.getUTCDay() + 6) % 7;
    local.setUTCDate(local.getUTCDate() - daysSinceMonday);
  } else {
    local.setUTCHours(0, 0, 0, 0);
  }
  return new Date(local.getTime() - DHAKA_OFFSET_MS);
};

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

const aggregatePeriod = async (
  dateFrom: Date,
  dateTo: Date,
  currency: "BDT" | "USD",
) => {
  const [orders, returns, payments, refunds, pendingRefundsCount] =
    await Promise.all([
      loadSalesOrders(dateFrom, dateTo, currency),
      loadApprovedReturns(dateFrom, dateTo, currency),
      prisma.payment.findMany({
        where: {
          deletedAt: null,
          paidAt: { gte: dateFrom, lte: dateTo },
          currency,
          status: {
            notIn: ["PENDING", "INITIATED", "FAILED", "CANCELLED"],
          },
        },
        select: { amount: true },
      }),
      prisma.refund.findMany({
        where: {
          status: "COMPLETED",
          refundedAt: { gte: dateFrom, lte: dateTo },
          payment: { deletedAt: null, currency },
        },
        select: { amount: true },
      }),
      prisma.refund.count({
        where: {
          status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
          createdAt: { gte: dateFrom, lte: dateTo },
          payment: { deletedAt: null, currency },
        },
      }),
    ]);

  const sales = saleRecords(orders);
  const returned = returns.records;

  const grossProductSalesMinor = sum(sales.map((row) => row.grossMinor));
  const productDiscountsMinor = sum(sales.map((row) => row.discountMinor));
  const taxMinor = sum(sales.map((row) => row.taxMinor));
  const grossNetSalesMinor = sum(sales.map((row) => row.netSalesMinor));
  const salesReversedMinor = sum(returned.map((row) => row.salesMinor));
  const netProductSalesMinor = grossNetSalesMinor - salesReversedMinor;

  const knownSalesNetMinor = sum(
    sales.filter((row) => row.costKnown).map((row) => row.netSalesMinor),
  );
  const knownSalesCogsMinor = sum(
    sales.filter((row) => row.costKnown).map((row) => row.costMinor ?? 0),
  );
  const costReversedMinor = sum(returned.map((row) => row.costMinor));
  const netCogsMinor = knownSalesCogsMinor - costReversedMinor;

  const completeCostData =
    sales.every((row) => row.costKnown) &&
    returned.every((row) => !row.costReversalApplicable || row.costKnown);

  const shippingIncomeMinor = sum(
    orders.map((order) => toMinor(order.shippingAmount)),
  );
  const shippingExpenseMinor = sum(
    orders.flatMap((order) =>
      order.shipments.map((shipment) => toMinor(shipment.shippingCost)),
    ),
  );
  const netShippingMinor = shippingIncomeMinor - returns.shippingRefundedMinor;
  const netShippingResultMinor = netShippingMinor - shippingExpenseMinor;
  const costMissingLines =
    sales.filter((row) => !row.costKnown).length +
    returned.filter((row) => row.costReversalApplicable && !row.costKnown)
      .length;

  const cashCollectedMinor = sum(
    payments.map((payment) => toMinor(payment.amount)),
  );
  const cashRefundedMinor = sum(
    refunds.map((refund) => toMinor(refund.amount)),
  );

  const outstandingCodMinor = sum(
    orders
      .filter(
        (order) =>
          order.status === "DELIVERED" &&
          order.paymentStatus !== "PAID" &&
          order.payments.some((payment) => payment.method === "COD"),
      )
      .map((order) => toMinor(order.grandTotal)),
  );

  const estimatedGrossProfitMinor = netProductSalesMinor - netCogsMinor;
  const returnedQuantity = sum(returned.map((row) => row.quantity));

  return {
    orders,
    sales,
    returned,
    grossProductSalesMinor,
    productDiscountsMinor,
    taxMinor,
    netProductSalesMinor,
    salesReversedMinor,
    knownSalesNetMinor,
    knownSalesCogsMinor,
    costReversedMinor,
    netCogsMinor,
    shippingIncomeMinor,
    shippingRefundedMinor: returns.shippingRefundedMinor,
    netShippingMinor,
    shippingExpenseMinor,
    netShippingResultMinor,
    costMissingLines,
    cashCollectedMinor,
    cashRefundedMinor,
    outstandingCodMinor,
    estimatedGrossProfitMinor,
    returnedQuantity,
    completeCostData,
    pendingRefundsCount,
  };
};

export const getOverview = async (query: OverviewQuery) => {
  const { dateFrom, dateTo, lowStockThreshold, currency } = query;
  const key = cacheKey([
    "overview",
    currency,
    iso(dateFrom),
    iso(dateTo),
    lowStockThreshold,
  ]);

  return cached(key, async () => {
    const dateFilter = { gte: dateFrom, lte: dateTo };
    const [period, pendingPaymentsCount, lowStockCount, newCustomersCount] =
      await Promise.all([
        aggregatePeriod(dateFrom, dateTo, currency),
        prisma.payment.count({
          where: {
            deletedAt: null,
            currency,
            status: { in: ["PENDING", "INITIATED"] },
          },
        }),
        prisma.inventory.count({
          where: { quantityAvailable: { lt: lowStockThreshold } },
        }),
        prisma.customerProfile.count({
          where: { deletedAt: null, createdAt: dateFilter },
        }),
      ]);

    const totalOrders = period.orders.length;
    const averageOrderValue =
      totalOrders > 0 ? money(period.netProductSalesMinor) / totalOrders : 0;
    const estimatedGrossMarginPercent = percent(
      period.estimatedGrossProfitMinor,
      period.netProductSalesMinor,
    );

    return {
      currency,
      timezone: DHAKA_TIME_ZONE,
      reportingBasis: {
        sales: "Delivered orders, by delivery date in Asia/Dhaka",
        returns: "Approved returns, by approval date in Asia/Dhaka",
        cash: "Payments collected and refunds completed in the period",
        cogs: "Order-line cost snapshots at sale time; unknown costs excluded",
      },
      grossProductSales: money(period.grossProductSalesMinor),
      productDiscounts: money(period.productDiscountsMinor),
      taxAmount: money(period.taxMinor),
      netProductSales: money(period.netProductSalesMinor),
      salesReversed: money(period.salesReversedMinor),
      shippingIncome: money(period.shippingIncomeMinor),
      shippingRefunded: money(period.shippingRefundedMinor),
      netShippingIncome: money(period.netShippingMinor),
      shippingExpense: money(period.shippingExpenseMinor),
      netShippingResult: money(period.netShippingResultMinor),
      knownCogs: money(period.netCogsMinor),
      estimatedGrossProfit: money(period.estimatedGrossProfitMinor),
      estimatedGrossMarginPercent,
      costCoveragePercent: percent(
        period.knownSalesNetMinor,
        period.netProductSalesMinor + period.salesReversedMinor,
      ),
      costDataComplete: period.completeCostData,
      costMissingLines: period.costMissingLines,
      totalOrders,
      averageOrderValue,
      pendingPaymentsCount,
      lowStockCount,
      newCustomersCount,
      totalRefunded: money(period.cashRefundedMinor),
      pendingRefundsCount: period.pendingRefundsCount,
      cashCollected: money(period.cashCollectedMinor),
      cashRefunded: money(period.cashRefundedMinor),
      netCash: money(period.cashCollectedMinor - period.cashRefundedMinor),
      outstandingCod: money(period.outstandingCodMinor),
      returnedQuantity: period.returnedQuantity,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
    };
  });
};

export const getSales = async (query: SalesQuery) => {
  const { dateFrom, dateTo, groupBy, currency } = query;
  const key = cacheKey([
    "sales",
    currency,
    iso(dateFrom),
    iso(dateTo),
    groupBy,
  ]);

  return cached(key, async () => {
    const period = await aggregatePeriod(dateFrom, dateTo, currency);
    const buckets = new Map<
      string,
      {
        period: string;
        grossProductSalesMinor: number;
        productDiscountsMinor: number;
        taxMinor: number;
        salesReversedMinor: number;
        netProductSalesMinor: number;
        orders: number;
      }
    >();

    const bucketFor = (date: Date) => {
      const bucket = dhakaBucket(date, groupBy);
      const id = bucket.toISOString();
      let entry = buckets.get(id);
      if (!entry) {
        entry = {
          period: id,
          grossProductSalesMinor: 0,
          productDiscountsMinor: 0,
          taxMinor: 0,
          salesReversedMinor: 0,
          netProductSalesMinor: 0,
          orders: 0,
        };
        buckets.set(id, entry);
      }
      return entry;
    };

    for (const order of period.orders) {
      const entry = bucketFor(order.deliveredAt!);
      entry.orders += 1;
    }

    for (const row of period.sales) {
      const entry = bucketFor(row.occurredAt);
      entry.grossProductSalesMinor += row.grossMinor;
      entry.productDiscountsMinor += row.discountMinor;
      entry.taxMinor += row.taxMinor;
      entry.netProductSalesMinor += row.netSalesMinor;
    }

    for (const row of period.returned) {
      const entry = bucketFor(row.occurredAt);
      entry.salesReversedMinor += row.salesMinor;
      entry.netProductSalesMinor -= row.salesMinor;
    }

    return {
      currency,
      timezone: DHAKA_TIME_ZONE,
      groupBy,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
      series: [...buckets.values()]
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((entry) => ({
          period: entry.period,
          grossProductSales: money(entry.grossProductSalesMinor),
          productDiscounts: money(entry.productDiscountsMinor),
          taxAmount: money(entry.taxMinor),
          salesReversed: money(entry.salesReversedMinor),
          netProductSales: money(entry.netProductSalesMinor),
          orders: entry.orders,
        })),
    };
  });
};

export const getTopProducts = async (query: TopProductsQuery) => {
  const { dateFrom, dateTo, limit, sortBy, currency } = query;
  const key = cacheKey([
    "top-products",
    currency,
    iso(dateFrom),
    iso(dateTo),
    limit,
    sortBy,
  ]);

  return cached(key, async () => {
    const period = await aggregatePeriod(dateFrom, dateTo, currency);
    const grouped = new Map<
      string,
      {
        sku: string;
        productName: string;
        quantitySold: number;
        quantityReturned: number;
        grossProductSalesMinor: number;
        productDiscountsMinor: number;
        netProductSalesMinor: number;
        knownCogsMinor: number;
        knownNetSalesMinor: number;
        costDataComplete: boolean;
      }
    >();

    for (const row of period.sales) {
      const key = row.sku;
      let entry = grouped.get(key);
      if (!entry) {
        entry = {
          sku: row.sku,
          productName: row.productName,
          quantitySold: 0,
          quantityReturned: 0,
          grossProductSalesMinor: 0,
          productDiscountsMinor: 0,
          netProductSalesMinor: 0,
          knownCogsMinor: 0,
          knownNetSalesMinor: 0,
          costDataComplete: true,
        };
        grouped.set(key, entry);
      }
      entry.quantitySold += row.quantity;
      entry.grossProductSalesMinor += row.grossMinor;
      entry.productDiscountsMinor += row.discountMinor;
      entry.netProductSalesMinor += row.netSalesMinor;
      if (row.costKnown) {
        entry.knownCogsMinor += row.costMinor ?? 0;
        entry.knownNetSalesMinor += row.netSalesMinor;
      } else {
        entry.costDataComplete = false;
      }
    }

    for (const row of period.returned) {
      const key = row.sku;
      let entry = grouped.get(key);
      if (!entry) {
        entry = {
          sku: row.sku,
          productName: row.productName,
          quantitySold: 0,
          quantityReturned: 0,
          grossProductSalesMinor: 0,
          productDiscountsMinor: 0,
          netProductSalesMinor: 0,
          knownCogsMinor: 0,
          knownNetSalesMinor: 0,
          costDataComplete: true,
        };
        grouped.set(key, entry);
      }
      entry.quantityReturned += row.quantity;
      entry.netProductSalesMinor -= row.salesMinor;
      entry.knownCogsMinor -= row.costMinor;
      if (!row.costKnown) entry.costDataComplete = false;
    }

    const products = [...grouped.values()]
      .map((entry) => ({
        sku: entry.sku,
        productName: entry.productName,
        quantitySold: entry.quantitySold,
        quantityReturned: entry.quantityReturned,
        netQuantity: entry.quantitySold - entry.quantityReturned,
        grossProductSales: money(entry.grossProductSalesMinor),
        productDiscounts: money(entry.productDiscountsMinor),
        netProductSales: money(entry.netProductSalesMinor),
        knownCogs: money(entry.knownCogsMinor),
        estimatedGrossProfit: money(
          entry.netProductSalesMinor - entry.knownCogsMinor,
        ),
        costCoveragePercent: Math.min(
          100,
          percent(entry.knownNetSalesMinor, entry.netProductSalesMinor),
        ),
        costDataComplete: entry.costDataComplete,
      }))
      .sort((a, b) =>
        sortBy === "quantity"
          ? b.netQuantity - a.netQuantity ||
            b.netProductSales - a.netProductSales
          : b.netProductSales - a.netProductSales ||
            b.netQuantity - a.netQuantity,
      )
      .slice(0, limit);

    return {
      currency,
      timezone: DHAKA_TIME_ZONE,
      sortBy,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
      products,
    };
  });
};

export const getOrdersByStatus = async (query: OrdersByStatusQuery) => {
  const { dateFrom, dateTo, currency } = query;
  const key = cacheKey([
    "orders-by-status",
    currency,
    iso(dateFrom),
    iso(dateTo),
  ]);

  return cached(key, async () => {
    const grouped = await prisma.order.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        currency,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      grouped.map((row) => [row.status, row._count._all]),
    ) as Record<string, number>;

    return {
      currency,
      timezone: DHAKA_TIME_ZONE,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
      breakdown: {
        PENDING: counts.PENDING ?? 0,
        CONFIRMED: counts.CONFIRMED ?? 0,
        PROCESSING: counts.PROCESSING ?? 0,
        PACKED: counts.PACKED ?? 0,
        SHIPPED: counts.SHIPPED ?? 0,
        DELIVERED: counts.DELIVERED ?? 0,
        CANCELLED: counts.CANCELLED ?? 0,
      },
    };
  });
};
