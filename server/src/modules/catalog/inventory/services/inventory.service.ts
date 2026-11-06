import { prisma, transaction, type TransactionClient } from "../../../../lib/prisma.ts";
import { invalidateCatalogCacheForVariants } from "../../../../lib/cache.ts";
import { env } from "../../../../config/env.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import { logger } from "../../../../common/looger/logger.ts";
import { withDbRetry } from "../../../../common/utils/db-retry.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { notifyLowStock } from "../../../notification/services/notification.service.ts";
import { isLowStockTrigger } from "../utils/low-stock.ts";
import { Prisma } from "../../../../generated/prisma/client.ts";
import type {
  CreateInventoryAdjustmentInput,
  CreateInventoryTransferInput,
  InventoryLedgerRow,
  ListInventoryQuery,
  LockedInventory,
  SetStockLevelsInput,
} from "../types.ts";

export const getDefaultWarehouse = async (tx?: TransactionClient) => {
  const db = tx ?? prisma;

  const warehouse = await db.warehouse.findFirst({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return warehouse;
};

export const lockInventory = async (
  tx: TransactionClient,
  variantId: string,
  warehouseId: string
) => {
  const rows = await tx.$queryRaw<LockedInventory[]>`SELECT id, "quantityAvailable", "quantityReserved" FROM "inventory" WHERE "variantId" = ${variantId} AND "warehouseId" = ${warehouseId} FOR UPDATE`;

  return rows[0] ?? null;
};

export const lockInventoryForVariants = async (
  tx: TransactionClient,
  warehouseId: string,
  variantIds: string[],
) => {
  if (variantIds.length === 0) return [];
  const uniqueIds = [...new Set(variantIds)].sort((a, b) => a.localeCompare(b));
  return tx.$queryRaw<LockedInventory[]>`
    SELECT id, "variantId", "warehouseId", "quantityOnHand", "quantityAvailable", "quantityReserved"
    FROM "inventory"
    WHERE "warehouseId" = ${warehouseId}
      AND "variantId" IN (${Prisma.join(uniqueIds)})
    ORDER BY "variantId" ASC
    FOR UPDATE
  `;
};

export const lockCheckoutInventory = async (
  tx: TransactionClient,
  variantIds: string[],
) => {
  if (variantIds.length === 0) {
    const warehouse = await getDefaultWarehouse(tx);
    return { warehouseId: warehouse?.id ?? null, rows: [] as LockedInventory[] };
  }

  const uniqueIds = [...new Set(variantIds)].sort((a, b) => a.localeCompare(b));
  const rows = await tx.$queryRaw<LockedInventory[]>`
    SELECT
      i.id,
      i."variantId",
      i."warehouseId",
      i."quantityAvailable",
      i."quantityReserved"
    FROM "inventory" i
    WHERE i."warehouseId" = (
      SELECT id
      FROM "warehouse"
      WHERE "isActive" = true AND "deletedAt" IS NULL
      ORDER BY "createdAt" ASC
      LIMIT 1
    )
      AND i."variantId" IN (${Prisma.join(uniqueIds)})
    ORDER BY i."variantId" ASC
    FOR UPDATE
  `;

  if (rows.length > 0) {
    return { warehouseId: rows[0]!.warehouseId ?? null, rows };
  }

  const warehouse = await getDefaultWarehouse(tx);
  return { warehouseId: warehouse?.id ?? null, rows };
};

export const applyInventoryReservations = async (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
) => {
  if (rows.length === 0) return;
  const merged = new Map<string, number>();
  for (const row of rows) {
    merged.set(row.id, (merged.get(row.id) ?? 0) + row.quantity);
  }
  const ids = [...merged.keys()];
  const quantities = [...merged.values()];
  await tx.$executeRaw`
    UPDATE "inventory" AS i
    SET
      "quantityReserved" = i."quantityReserved" + v.qty,
      "quantityAvailable" = i."quantityAvailable" - v.qty,
      "lastTransactionAt" = now()
    FROM unnest(
      ARRAY[${Prisma.join(ids)}]::text[],
      ARRAY[${Prisma.join(quantities)}]::int[]
    ) AS v(id, qty)
    WHERE i.id = v.id
  `;
};

const applyInventoryDeltas = async (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
  mode: "commit" | "release",
) => {
  if (rows.length === 0) return;
  const merged = new Map<string, number>();
  for (const row of rows) {
    merged.set(row.id, (merged.get(row.id) ?? 0) + row.quantity);
  }
  const ids = [...merged.keys()];
  const quantities = [...merged.values()];
  if (mode === "commit") {
    await tx.$executeRaw`
      UPDATE "inventory" AS i
      SET
        "quantityOnHand" = i."quantityOnHand" - v.qty,
        "quantityReserved" = i."quantityReserved" - v.qty,
        "lastTransactionAt" = now()
      FROM unnest(
        ARRAY[${Prisma.join(ids)}]::text[],
        ARRAY[${Prisma.join(quantities)}]::int[]
      ) AS v(id, qty)
      WHERE i.id = v.id
    `;
    return;
  }
  await tx.$executeRaw`
    UPDATE "inventory" AS i
    SET
      "quantityReserved" = i."quantityReserved" - v.qty,
      "quantityAvailable" = i."quantityAvailable" + v.qty,
      "lastTransactionAt" = now()
    FROM unnest(
      ARRAY[${Prisma.join(ids)}]::text[],
      ARRAY[${Prisma.join(quantities)}]::int[]
    ) AS v(id, qty)
    WHERE i.id = v.id
  `;
};

export const applyInventoryCommits = (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
) => applyInventoryDeltas(tx, rows, "commit");

export const applyInventoryReleases = (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
) => applyInventoryDeltas(tx, rows, "release");

const applyInventoryOnHandDeltas = async (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
  direction: "in" | "out",
) => {
  if (rows.length === 0) return;
  const merged = new Map<string, number>();
  for (const row of rows) {
    merged.set(row.id, (merged.get(row.id) ?? 0) + row.quantity);
  }
  const ids = [...merged.keys()];
  const quantities = [...merged.values()];
  if (direction === "in") {
    await tx.$executeRaw`
      UPDATE "inventory" AS i
      SET
        "quantityOnHand" = i."quantityOnHand" + v.qty,
        "quantityAvailable" = i."quantityAvailable" + v.qty,
        "lastTransactionAt" = now()
      FROM unnest(
        ARRAY[${Prisma.join(ids)}]::text[],
        ARRAY[${Prisma.join(quantities)}]::int[]
      ) AS v(id, qty)
      WHERE i.id = v.id
    `;
    return;
  }
  await tx.$executeRaw`
    UPDATE "inventory" AS i
    SET
      "quantityOnHand" = i."quantityOnHand" - v.qty,
      "quantityAvailable" = i."quantityAvailable" - v.qty,
      "lastTransactionAt" = now()
    FROM unnest(
      ARRAY[${Prisma.join(ids)}]::text[],
      ARRAY[${Prisma.join(quantities)}]::int[]
    ) AS v(id, qty)
    WHERE i.id = v.id
  `;
};

export const applyInventoryRestocks = (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
) => applyInventoryOnHandDeltas(tx, rows, "in");

export const applyInventoryOnHandDecrements = (
  tx: TransactionClient,
  rows: Array<{ id: string; quantity: number }>,
) => applyInventoryOnHandDeltas(tx, rows, "out");

/**
 * Commit reserved stock into an actual sale.
 *
 * Moves each reservation from `quantityReserved` to a decremented
 * `quantityOnHand` (STOCK_OUT) and clears the reservation rows. Must run in the
 * same transaction that marks the order paid so a paid order always consumes
 * stock exactly once.
 */
export const commitOrderStock = async (
  tx: TransactionClient,
  orderId: string,
  orderNumber: string,
  actorId: string
) => {
  const reservations = await tx.stockReservation.findMany({ where: { orderId } });
  if (reservations.length === 0) {
    const reservedItems = await tx.orderItem.count({
      where: { orderId, variantId: { not: null } },
    });
    if (reservedItems > 0) {
      throw new AppError(
        "Cannot commit stock: reservations missing for paid order",
        409,
      );
    }
    return;
  }

  const sorted = [...reservations].sort((a, b) =>
    a.warehouseId === b.warehouseId
      ? a.variantId.localeCompare(b.variantId)
      : a.warehouseId.localeCompare(b.warehouseId)
  );

  const warehouseIds = [...new Set(sorted.map((row) => row.warehouseId))].sort((a, b) =>
    a.localeCompare(b),
  );
  const inventoryByKey = new Map<string, LockedInventory>();
  for (const warehouseId of warehouseIds) {
    const variantIds = sorted
      .filter((row) => row.warehouseId === warehouseId)
      .map((row) => row.variantId);
    const lockedRows = await lockInventoryForVariants(tx, warehouseId, variantIds);
    for (const row of lockedRows) {
      inventoryByKey.set(`${row.warehouseId}:${row.variantId}`, row);
    }
  }

  const transactions: InventoryLedgerRow[] = [];
  const commitUpdates: Array<{ id: string; quantity: number }> = [];

  for (const reservation of sorted) {
    const invRow = inventoryByKey.get(`${reservation.warehouseId}:${reservation.variantId}`);
    if (!invRow) {
      throw new AppError(
        `Cannot commit stock: inventory missing for variant ${reservation.variantId}`,
        409,
      );
    }

    commitUpdates.push({ id: invRow.id, quantity: reservation.quantity });

    transactions.push({
      inventoryId: invRow.id,
      variantId: reservation.variantId,
      warehouseId: reservation.warehouseId,
      type: "STOCK_OUT",
      quantity: reservation.quantity,
      referenceType: "ORDER",
      referenceId: orderNumber,
      remarks: "Stock committed on payment success",
      createdBy: actorId,
    });
  }

  await applyInventoryCommits(tx, commitUpdates);

  if (transactions.length > 0) {
    await tx.inventoryTransaction.createMany({ data: transactions });
  }

  await tx.stockReservation.deleteMany({ where: { orderId } });
};

export const listInventory = async (query: ListInventoryQuery) => {
  return withDbRetry(async () => {
    const search = query.search?.trim();
    const where: Prisma.InventoryWhereInput = {
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.variantId && { variantId: query.variantId }),
      // Soft-deleted variants/products must not linger in the inventory list.
      // When a product's variant set changes (e.g. a simple product gains
      // options), the replaced variant is soft-deleted but its inventory row
      // remains; without this filter the old and new SKUs both appear.
      variant: { deletedAt: null, product: { deletedAt: null } },
      ...(query.lowStockOnly && {
        quantityAvailable: { lt: env.LOW_STOCK_THRESHOLD },
      }),
    };

    if (search) {
      const pattern = `%${search}%`;
      const matches = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT pv.id
        FROM "product_variant" pv
        INNER JOIN "product" p ON p.id = pv."productId"
        WHERE pv."deletedAt" IS NULL
          AND p."deletedAt" IS NULL
          AND (pv.sku ILIKE ${pattern} OR p.name ILIKE ${pattern})
      `;
      const variantIds = matches.map((row) => row.id);
      if (variantIds.length === 0) {
        return {
          ...paginated([], query.page, query.limit, 0),
          lowStockThreshold: env.LOW_STOCK_THRESHOLD,
        };
      }
      if (query.variantId && !variantIds.includes(query.variantId)) {
        return {
          ...paginated([], query.page, query.limit, 0),
          lowStockThreshold: env.LOW_STOCK_THRESHOLD,
        };
      }
      if (!query.variantId) {
        where.variantId = { in: variantIds };
      }
    }

    const items = await prisma.inventory.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        variant: {
          select: {
            id: true,
            sku: true,
            product: { select: { id: true, name: true, slug: true } },
            attributes: {
              select: { attributeValue: { select: { value: true } } },
            },
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    const total = await prisma.inventory.count({ where });

    // Resolve the last updater's display name in one query for the whole page.
    const updaterIds = [
      ...new Set(
        items
          .map((item) => item.lastUpdatedBy)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const updaters = updaterIds.length
      ? await prisma.user.findMany({
          where: { id: { in: updaterIds } },
          select: { id: true, name: true },
        })
      : [];
    const updaterNameById = new Map(updaters.map((user) => [user.id, user.name]));

    const enriched = items.map((item) => {
      const { lastUpdatedBy, stockUpdatedAt, variant, ...rest } = item;
      const variantName = (variant.attributes ?? [])
        .map((attribute) => attribute.attributeValue.value)
        .filter(Boolean)
        .join(" / ");
      return {
        ...rest,
        variant: {
          id: variant.id,
          sku: variant.sku,
          product: variant.product,
        },
        variantName: variantName || null,
        lastUpdatedAt: stockUpdatedAt,
        lastUpdatedByName: lastUpdatedBy
          ? (updaterNameById.get(lastUpdatedBy) ?? null)
          : null,
      };
    });

    return {
      ...paginated(enriched, query.page, query.limit, total),
      lowStockThreshold: env.LOW_STOCK_THRESHOLD,
    };
  });
};

export const createInventoryAdjustment = async (
  input: CreateInventoryAdjustmentInput,
  createdBy: string
) => {
  const inventory = await prisma.inventory.findUnique({
    where: {
      warehouseId_variantId: {
        warehouseId: input.warehouseId,
        variantId: input.variantId,
      },
    },
  });

  if (!inventory) {
    throw new AppError(
      "No inventory record exists for this variant in the warehouse",
      400
    );
  }

  return prisma.inventoryAdjustment.create({
    data: {
      warehouseId: input.warehouseId,
      variantId: input.variantId,
      previousQuantity: inventory.quantityOnHand,
      adjustedQuantity: inventory.quantityOnHand + input.difference,
      difference: input.difference,
      reason: input.reason,
      status: "PENDING",
      createdBy,
    },
  });
};

export type LowStockAlert = {
  variantId: string;
  warehouseId: string;
  quantityAvailable: number;
};

/**
 * Runs after the stock transaction commits. Enriches the raw inventory rows
 * with product/warehouse labels and hands them to the notification service,
 * which fans out one digest email per administrator.
 */
export const dispatchLowStockAlerts = async (alerts: LowStockAlert[]) => {
  if (alerts.length === 0) return;

  try {
    const [variants, warehouses] = await Promise.all([
      prisma.productVariant.findMany({
        where: { id: { in: [...new Set(alerts.map((row) => row.variantId))] } },
        select: { id: true, sku: true, product: { select: { name: true } } },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: [...new Set(alerts.map((row) => row.warehouseId))] } },
        select: { id: true, name: true },
      }),
    ]);

    const variantById = new Map(variants.map((row) => [row.id, row]));
    const warehouseById = new Map(warehouses.map((row) => [row.id, row]));

    await notifyLowStock(
      alerts.flatMap((alert) => {
        const variant = variantById.get(alert.variantId);
        const warehouse = warehouseById.get(alert.warehouseId);
        if (!variant || !warehouse) return [];
        return [
          {
            productName: variant.product.name,
            sku: variant.sku,
            warehouseName: warehouse.name,
            quantityAvailable: alert.quantityAvailable,
          },
        ];
      }),
    );
  } catch (err) {
    logger.error({
      msg: "Failed to dispatch low stock alerts",
      alertCount: alerts.length,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const approveInventoryAdjustment = async (
  adjustmentId: string,
  approved: boolean,
  approvedBy: string
) => {
  const { result, variantId, alert } = await transaction(async (tx) => {
    const adjustment = await tx.inventoryAdjustment.findUnique({
      where: { id: adjustmentId },
    });

    if (!adjustment) throw new AppError("Adjustment not found", 404);
    if (adjustment.status !== "PENDING") {
      throw new AppError("Adjustment already processed", 400);
    }

    // Maker-checker: the creator of a stock correction cannot approve it.
    if (adjustment.createdBy === approvedBy) {
      throw new AppError(
        "An inventory adjustment cannot be approved by the person who created it",
        409,
        "INVENTORY_MAKER_CHECKER"
      );
    }

    if (!approved) {
      return {
        result: await tx.inventoryAdjustment.update({
          where: { id: adjustmentId },
          data: { status: "REJECTED", approvedBy },
        }),
        variantId: adjustment.variantId,
        alert: null,
      };
    }

    const invRow = await tx.$queryRaw<
      Array<{ id: string; quantityOnHand: number; quantityAvailable: number }>
    >`SELECT id, "quantityOnHand", "quantityAvailable" FROM "inventory" WHERE "variantId" = ${adjustment.variantId} AND "warehouseId" = ${adjustment.warehouseId} FOR UPDATE`;

    if (!invRow[0]) throw new AppError("Inventory record not found", 404);

    const current = invRow[0];
    if (current.quantityOnHand !== adjustment.previousQuantity) {
      throw new AppError(
        "Inventory quantity has changed since this adjustment was created",
        409
      );
    }

    const resultingOnHand = current.quantityOnHand + adjustment.difference;
    const resultingAvailable = current.quantityAvailable + adjustment.difference;
    if (resultingOnHand < 0 || resultingAvailable < 0) {
      throw new AppError("Adjustment would result in negative inventory", 400);
    }

    const inventory = await tx.inventory.update({
      where: { id: current.id },
      data: {
        quantityOnHand: { increment: adjustment.difference },
        quantityAvailable: { increment: adjustment.difference },
        lastTransactionAt: new Date(),
        lastUpdatedBy: approvedBy,
        stockUpdatedAt: new Date(),
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        variantId: adjustment.variantId,
        warehouseId: adjustment.warehouseId,
        type: adjustment.difference >= 0 ? "ADJUSTMENT_INCREASE" : "ADJUSTMENT_DECREASE",
        quantity: Math.abs(adjustment.difference),
        referenceType: "INVENTORY_ADJUSTMENT",
        referenceId: adjustment.id,
        remarks: adjustment.reason,
        createdBy: approvedBy,
      },
    });

    if (inventory.quantityAvailable < env.LOW_STOCK_THRESHOLD) {
      await tx.inventoryEvent.create({
        data: {
          warehouseId: adjustment.warehouseId,
          variantId: adjustment.variantId,
          eventType: inventory.quantityAvailable <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
          metadata: { quantityAvailable: inventory.quantityAvailable },
        },
      });
    }

    return {
      result: await tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: "APPROVED", approvedBy },
      }),
      variantId: adjustment.variantId,
      alert: isLowStockTrigger(
        current.quantityAvailable,
        inventory.quantityAvailable
      )
        ? {
            variantId: adjustment.variantId,
            warehouseId: adjustment.warehouseId,
            quantityAvailable: inventory.quantityAvailable,
          }
        : null,
    };
  });

  // Non-approved adjustments change nothing on the storefront.
  if (approved) {
    await invalidateCatalogCacheForVariants([variantId]);
    if (alert) await dispatchLowStockAlerts([alert]);
  }
  return result;
};

/**
 * Applies a batch of desired stock levels in one transaction. Unlike the
 * maker-checker correction flow (`createInventoryAdjustment` + approve), initial
 * stock entry is written straight through so the product wizard needs a single
 * round-trip instead of two per variant. The audit trail is preserved: every
 * variant whose level changed gets an APPROVED adjustment plus an inventory
 * transaction, and low-stock/out-of-stock events still fire.
 *
 * It takes target levels, not deltas, so resending the same payload is a no-op.
 */
export const setStockLevels = async (
  input: SetStockLevelsInput,
  createdBy: string
) => {
  const variantIds = [...new Set(input.items.map((item) => item.variantId))];
  const targetByVariant = new Map(
    input.items.map((item) => [item.variantId, item.targetQty])
  );

  const { warehouseId, changes, lowStockAlerts } = await transaction(async (tx) => {
    const warehouse = input.warehouseId
      ? await tx.warehouse.findFirst({
          where: { id: input.warehouseId, isActive: true, deletedAt: null },
          select: { id: true },
        })
      : await getDefaultWarehouse(tx);

    if (!warehouse) {
      throw new AppError("No active warehouse found — create a warehouse first", 400);
    }

    const lockedRows = await lockInventoryForVariants(tx, warehouse.id, variantIds);
    const lockedByVariant = new Map(
      lockedRows.map((row) => [row.variantId as string, row])
    );
    const missing = variantIds.filter((id) => !lockedByVariant.has(id));
    if (missing.length) {
      throw new AppError(
        "No inventory record exists for one or more variants in the warehouse",
        400
      );
    }

    const applied: Array<{
      variantId: string;
      quantityOnHand: number;
      quantityAvailable: number;
      difference: number;
    }> = [];
    const lowStockAlerts: LowStockAlert[] = [];

    for (const variantId of variantIds) {
      const row = lockedByVariant.get(variantId)!;
      const currentOnHand = row.quantityOnHand ?? 0;
      const currentAvailable = row.quantityAvailable ?? 0;
      const difference = (targetByVariant.get(variantId) ?? 0) - currentOnHand;
      if (difference === 0) continue;

      const resultingOnHand = currentOnHand + difference;
      const resultingAvailable = currentAvailable + difference;
      if (resultingOnHand < 0 || resultingAvailable < 0) {
        throw new AppError("Adjustment would result in negative inventory", 400);
      }

      const inventory = await tx.inventory.update({
        where: { id: row.id },
        data: {
          quantityOnHand: { increment: difference },
          quantityAvailable: { increment: difference },
          lastTransactionAt: new Date(),
          lastUpdatedBy: createdBy,
          stockUpdatedAt: new Date(),
        },
      });

      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          warehouseId: warehouse.id,
          variantId,
          previousQuantity: currentOnHand,
          adjustedQuantity: resultingOnHand,
          difference,
          reason: difference > 0 ? "RESTOCK" : "CORRECTION",
          status: "APPROVED",
          createdBy,
          approvedBy: createdBy,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          variantId,
          warehouseId: warehouse.id,
          type: difference >= 0 ? "ADJUSTMENT_INCREASE" : "ADJUSTMENT_DECREASE",
          quantity: Math.abs(difference),
          referenceType: "INVENTORY_ADJUSTMENT",
          referenceId: adjustment.id,
          remarks: adjustment.reason,
          createdBy,
        },
      });

      if (inventory.quantityAvailable < env.LOW_STOCK_THRESHOLD) {
        await tx.inventoryEvent.create({
          data: {
            warehouseId: warehouse.id,
            variantId,
            eventType: inventory.quantityAvailable <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
            metadata: { quantityAvailable: inventory.quantityAvailable },
          },
        });
      }

      applied.push({
        variantId,
        quantityOnHand: inventory.quantityOnHand,
        quantityAvailable: inventory.quantityAvailable,
        difference,
      });

      if (isLowStockTrigger(currentAvailable, inventory.quantityAvailable)) {
        lowStockAlerts.push({
          variantId,
          warehouseId: warehouse.id,
          quantityAvailable: inventory.quantityAvailable,
        });
      }
    }

    return { warehouseId: warehouse.id, changes: applied, lowStockAlerts };
  });

  if (changes.length) {
    await invalidateCatalogCacheForVariants(changes.map((row) => row.variantId));
  }
  await dispatchLowStockAlerts(lowStockAlerts);

  return { warehouseId, items: changes };
};

export const createInventoryTransfer = async (
  input: CreateInventoryTransferInput,
  createdBy: string
) => {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new AppError("Source and destination warehouse must differ", 400);
  }

  return transaction(async (tx) => {
    const sortedItems = [...input.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId)
    );
    const requiredQty = new Map<string, number>();
    for (const item of sortedItems) {
      requiredQty.set(item.variantId, (requiredQty.get(item.variantId) ?? 0) + item.quantity);
    }
    const lockedRows = await lockInventoryForVariants(
      tx,
      input.fromWarehouseId,
      sortedItems.map((item) => item.variantId),
    );
    const lockedByVariant = new Map(lockedRows.map((row) => [row.variantId ?? "", row]));

    for (const [variantId, quantity] of requiredQty) {
      const invRow = lockedByVariant.get(variantId);
      if (!invRow) {
        throw new AppError(
          `No inventory record for variant ${variantId} in source warehouse`,
          400
        );
      }
      if (invRow.quantityAvailable < quantity) {
        throw new AppError(
          `Insufficient available stock for variant ${variantId}`,
          409
        );
      }
    }

    const transfer = await tx.inventoryTransfer.create({
      data: {
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        remarks: input.remarks ?? null,
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      },
    });

    await tx.inventoryEvent.create({
      data: {
        warehouseId: input.fromWarehouseId,
        variantId: input.items[0]!.variantId,
        eventType: "STOCK_TRANSFERRED",
        metadata: { transferId: transfer.id, createdBy },
      },
    });

    return transfer;
  });
};

export const completeInventoryTransfer = async (transferId: string, actor: string) => {
  const { result, variantIds } = await transaction(async (tx) => {
    const transfer = await tx.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });

    if (!transfer) throw new AppError("Transfer not found", 404);
    if (transfer.status !== "PENDING") {
      throw new AppError("Transfer already processed", 400);
    }

    const sortedItems = [...transfer.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId)
    );
    const variantIds = sortedItems.map((item) => item.variantId);
    const requiredQty = new Map<string, number>();
    for (const item of sortedItems) {
      requiredQty.set(item.variantId, (requiredQty.get(item.variantId) ?? 0) + item.quantity);
    }

    const warehouseIds = [transfer.fromWarehouseId, transfer.toWarehouseId].sort((a, b) =>
      a.localeCompare(b),
    );
    const lockedByWarehouse = new Map<string, Map<string, LockedInventory>>();
    for (const warehouseId of warehouseIds) {
      const lockedRows = await lockInventoryForVariants(tx, warehouseId, variantIds);
      lockedByWarehouse.set(
        warehouseId,
        new Map(lockedRows.map((row) => [row.variantId ?? "", row])),
      );
    }

    const sourceByVariant = lockedByWarehouse.get(transfer.fromWarehouseId) ?? new Map();
    const destByVariant = lockedByWarehouse.get(transfer.toWarehouseId) ?? new Map();
    const sourceUpdates: Array<{ id: string; quantity: number }> = [];
    const destUpdates: Array<{ id: string; quantity: number }> = [];
    const missingDest: Array<{ variantId: string; quantity: number }> = [];
    const transactions: InventoryLedgerRow[] = [];
    const touchedInventoryIds = new Set<string>();

    for (const [variantId, quantity] of requiredQty) {
      const fromRow = sourceByVariant.get(variantId);
      if (!fromRow) {
        throw new AppError(
          `No inventory record for variant ${variantId} in source warehouse`,
          400
        );
      }
      if (fromRow.quantityAvailable < quantity) {
        throw new AppError(
          `Insufficient available stock for variant ${variantId}`,
          409
        );
      }

      sourceUpdates.push({ id: fromRow.id, quantity });
      touchedInventoryIds.add(fromRow.id);
      transactions.push({
        inventoryId: fromRow.id,
        variantId,
        warehouseId: transfer.fromWarehouseId,
        type: "TRANSFER_OUT",
        quantity,
        referenceType: "INVENTORY_TRANSFER",
        referenceId: transferId,
        createdBy: actor,
      });

      const toInventory = destByVariant.get(variantId);
      if (toInventory) {
        destUpdates.push({ id: toInventory.id, quantity });
        touchedInventoryIds.add(toInventory.id);
        transactions.push({
          inventoryId: toInventory.id,
          variantId,
          warehouseId: transfer.toWarehouseId,
          type: "TRANSFER_IN",
          quantity,
          referenceType: "INVENTORY_TRANSFER",
          referenceId: transferId,
          createdBy: actor,
        });
      } else {
        missingDest.push({ variantId, quantity });
      }
    }

    await applyInventoryOnHandDecrements(tx, sourceUpdates);
    await applyInventoryRestocks(tx, destUpdates);

    if (missingDest.length > 0) {
      await tx.inventory.createMany({
        data: missingDest.map((row) => ({
          warehouseId: transfer.toWarehouseId,
          variantId: row.variantId,
          quantityOnHand: row.quantity,
          quantityReserved: 0,
          quantityAvailable: row.quantity,
        })),
      });
      const createdRows = await tx.inventory.findMany({
        where: {
          warehouseId: transfer.toWarehouseId,
          variantId: { in: missingDest.map((row) => row.variantId) },
        },
        select: { id: true, variantId: true },
      });
      const createdByVariant = new Map(createdRows.map((row) => [row.variantId, row.id]));
      for (const row of missingDest) {
        const inventoryId = createdByVariant.get(row.variantId);
        if (!inventoryId) continue;
        touchedInventoryIds.add(inventoryId);
        transactions.push({
          inventoryId,
          variantId: row.variantId,
          warehouseId: transfer.toWarehouseId,
          type: "TRANSFER_IN",
          quantity: row.quantity,
          referenceType: "INVENTORY_TRANSFER",
          referenceId: transferId,
          createdBy: actor,
        });
      }
    }

    if (transactions.length > 0) {
      await tx.inventoryTransaction.createMany({ data: transactions });
    }

    if (touchedInventoryIds.size > 0) {
      await tx.inventory.updateMany({
        where: { id: { in: [...touchedInventoryIds] } },
        data: { lastUpdatedBy: actor, stockUpdatedAt: new Date() },
      });
    }

    return {
      result: await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: "COMPLETED" },
      }),
      variantIds,
    };
  });

  await invalidateCatalogCacheForVariants(variantIds);
  return result;
};

export const listInventoryAdjustments = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        variant: { select: { id: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryAdjustment.count(),
  ]);

  return paginated(items, page, limit, total);
};

export const listInventoryTransfers = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.inventoryTransfer.findMany({
      include: {
        items: {
          include: {
            variant: { select: { id: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryTransfer.count(),
  ]);

  return paginated(items, page, limit, total);
};
