import { logger } from "../../../../common/looger/logger.ts";
import { waitWhileBusy } from "../../../../common/utils/worker.ts";
import { Prisma } from "../../../../generated/prisma/client.ts";
import { prisma } from "../../../../lib/prisma.ts";

const LOG_PREFIX = "[product-metrics-worker]";
const RECOMPUTE_INTERVAL_MS = 60 * 60 * 1000;
const SALES_WINDOW_DAYS = 30;
const TRENDING_WINDOW_DAYS = 7;
const UPDATE_CHUNK_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

// Orders in these states represent realized (net) sales. Pending orders are
// not yet a sale; cancelled/returned/refunded orders are subtracted out.
const REALIZED_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
] as const;

/** Sums sold units per variant for realized orders created since `since`. */
const aggregateVariantUnits = async (
  since: Date,
): Promise<Map<string, number>> => {
  const rows = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: {
      variantId: { not: null },
      order: {
        deletedAt: null,
        status: { in: [...REALIZED_STATUSES] },
        createdAt: { gte: since },
      },
    },
    _sum: { quantity: true },
  });

  const units = new Map<string, number>();
  for (const row of rows) {
    if (row.variantId) units.set(row.variantId, row._sum.quantity ?? 0);
  }
  return units;
};

/**
 * Recomputes the derived `salesCount30d` and `trendingScore` columns that the
 * storefront "best sellers" / "trending" collections sort by. Without this the
 * columns stay at their defaults and those sorts are meaningless.
 *
 * trendingScore = (units sold in the last 7 days) * 2 + (units sold in 30 days),
 * so recent demand is weighted more heavily. Returns the number of products
 * written.
 */
export const recomputeProductMetrics = async (): Promise<number> => {
  const now = Date.now();
  const salesSince = new Date(now - SALES_WINDOW_DAYS * DAY_MS);
  const trendingSince = new Date(now - TRENDING_WINDOW_DAYS * DAY_MS);

  const [sales30, sales7] = await Promise.all([
    aggregateVariantUnits(salesSince),
    aggregateVariantUnits(trendingSince),
  ]);

  const variantIds = [...new Set([...sales30.keys(), ...sales7.keys()])];
  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true },
      })
    : [];

  const metrics = new Map<string, { salesQty: number; recentQty: number }>();
  for (const variant of variants) {
    const current = metrics.get(variant.productId) ?? {
      salesQty: 0,
      recentQty: 0,
    };
    current.salesQty += sales30.get(variant.id) ?? 0;
    current.recentQty += sales7.get(variant.id) ?? 0;
    metrics.set(variant.productId, current);
  }

  // Products that currently hold a non-zero metric must be revisited even when
  // they have no sales now, so a value that aged out of the window is reset.
  const stale = await prisma.product.findMany({
    where: {
      OR: [{ salesCount30d: { not: 0 } }, { trendingScore: { not: 0 } }],
    },
    select: { id: true, salesCount30d: true, trendingScore: true },
  });
  const staleById = new Map(stale.map((product) => [product.id, product]));

  const candidateIds = new Set<string>([
    ...staleById.keys(),
    ...metrics.keys(),
  ]);

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const id of candidateIds) {
    const target = metrics.get(id) ?? { salesQty: 0, recentQty: 0 };
    const salesCount30d = target.salesQty;
    const trendingScore = target.recentQty * 2 + target.salesQty;
    const current = staleById.get(id);
    const changed =
      !current ||
      current.salesCount30d !== salesCount30d ||
      current.trendingScore !== trendingScore;
    if (changed) {
      updates.push(
        prisma.product.update({
          where: { id },
          data: { salesCount30d, trendingScore },
        }),
      );
    }
  }

  if (updates.length === 0) return 0;

  for (let i = 0; i < updates.length; i += UPDATE_CHUNK_SIZE) {
    await prisma.$transaction(updates.slice(i, i + UPDATE_CHUNK_SIZE));
  }
  return updates.length;
};

let intervalId: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;

const runCycle = async () => {
  if (cycleInFlight) return;
  cycleInFlight = true;
  try {
    const updated = await recomputeProductMetrics();
    if (updated > 0) {
      logger.info(`${LOG_PREFIX} recomputed ${updated} product(s)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${LOG_PREFIX} recompute failed: ${message}`);
  } finally {
    cycleInFlight = false;
  }
};

export const startProductMetricsWorker = (options?: { intervalMs?: number }) => {
  if (running) return;
  running = true;

  const intervalMs = options?.intervalMs ?? RECOMPUTE_INTERVAL_MS;
  void runCycle();
  intervalId = setInterval(() => void runCycle(), intervalMs);
  intervalId.unref?.();
};

export const stopProductMetricsWorker = async () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  await waitWhileBusy(() => cycleInFlight);
};
