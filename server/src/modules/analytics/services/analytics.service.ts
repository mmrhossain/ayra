import { Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../../lib/prisma.ts";
import { redisGet, redisSet } from "../../../lib/redis.ts";
import type { OrdersByStatusQuery, OverviewQuery, SalesQuery, TopProductsQuery } from "../types.ts";

const CACHE_TTL_SECONDS = 5 * 60;

const REVENUE_STATUSES = ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] as const;

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value);
};

const cacheKey = (parts: Array<string | number>) => `analytics:${parts.join(":")}`;

const iso = (d: Date) => new Date(Math.floor(d.getTime() / 60_000) * 60_000).toISOString();

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

const revenueWhere = (dateFrom: Date, dateTo: Date): Prisma.OrderWhereInput => ({
  deletedAt: null,
  createdAt: { gte: dateFrom, lte: dateTo },
  OR: [{ status: { in: [...REVENUE_STATUSES] } }, { paymentStatus: "PAID" }],
});

export const getOverview = async (query: OverviewQuery) => {
  const { dateFrom, dateTo, lowStockThreshold } = query;
  const key = cacheKey(["overview", iso(dateFrom), iso(dateTo), lowStockThreshold]);

  return cached(key, async () => {
    const dateFilter = { gte: dateFrom, lte: dateTo };

    const [revenueAgg, pendingPaymentsCount, lowStockCount, newCustomersCount] = await Promise.all([
      prisma.order.aggregate({
        where: revenueWhere(dateFrom, dateTo),
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.payment.count({
        where: {
          deletedAt: null,
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

    const totalRevenue = toNumber(revenueAgg._sum.grandTotal);
    const totalOrders = revenueAgg._count._all;
    const averageOrderValue = totalOrders === 0 ? 0 : totalRevenue / totalOrders;

    return {
      totalRevenue,
      totalOrders,
      pendingPaymentsCount,
      lowStockCount,
      newCustomersCount,
      averageOrderValue,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
    };
  });
};

const truncSql = (groupBy: SalesQuery["groupBy"]) => {
  if (groupBy === "week") return Prisma.sql`date_trunc('week', "createdAt")`;
  if (groupBy === "month") return Prisma.sql`date_trunc('month', "createdAt")`;
  return Prisma.sql`date_trunc('day', "createdAt")`;
};

export const getSales = async (query: SalesQuery) => {
  const { dateFrom, dateTo, groupBy } = query;
  const key = cacheKey(["sales", iso(dateFrom), iso(dateTo), groupBy]);

  return cached(key, async () => {
    const bucketExpr = truncSql(groupBy);
    const rows = await prisma.$queryRaw<
      Array<{ bucket: Date; revenue: Prisma.Decimal | number | null; orders: bigint | number }>
    >(Prisma.sql`
      SELECT
        ${bucketExpr} AS bucket,
        COALESCE(SUM("grandTotal"), 0) AS revenue,
        COUNT(*)::int AS orders
      FROM "order"
      WHERE "deletedAt" IS NULL
        AND "createdAt" >= ${dateFrom}
        AND "createdAt" <= ${dateTo}
        AND (
          "status" IN ('CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED')
          OR "paymentStatus" = 'PAID'
        )
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    return {
      groupBy,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
      series: rows.map((row) => ({
        period: new Date(row.bucket).toISOString(),
        revenue: toNumber(row.revenue),
        orders: toNumber(row.orders),
      })),
    };
  });
};

export const getTopProducts = async (query: TopProductsQuery) => {
  const { dateFrom, dateTo, limit, sortBy } = query;
  const key = cacheKey(["top-products", iso(dateFrom), iso(dateTo), limit, sortBy]);

  return cached(key, async () => {
    const grouped = await prisma.orderItem.groupBy({
      by: ["sku", "productName"],
      where: {
        order: revenueWhere(dateFrom, dateTo),
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });

    const products = grouped
      .map((row) => ({
        sku: row.sku,
        productName: row.productName,
        quantity: toNumber(row._sum.quantity),
        revenue: toNumber(row._sum.subtotal),
      }))
      .sort((a, b) =>
        sortBy === "quantity"
          ? b.quantity - a.quantity || b.revenue - a.revenue
          : b.revenue - a.revenue || b.quantity - a.quantity
      )
      .slice(0, limit);

    return {
      sortBy,
      dateFrom: iso(dateFrom),
      dateTo: iso(dateTo),
      products,
    };
  });
};

export const getOrdersByStatus = async (query: OrdersByStatusQuery) => {
  const { dateFrom, dateTo } = query;
  const key = cacheKey(["orders-by-status", iso(dateFrom), iso(dateTo)]);

  return cached(key, async () => {
    const grouped = await prisma.order.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      grouped.map((row) => [row.status, row._count._all])
    ) as Record<string, number>;

    return {
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
