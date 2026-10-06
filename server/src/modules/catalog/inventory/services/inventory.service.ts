import { prisma, transaction, type TransactionClient } from "../../../../lib/prisma.ts";
import { env } from "../../../../config/env.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { Prisma } from "../../../../generated/prisma/client.ts";
import type {
  CreateInventoryAdjustmentInput,
  CreateInventoryTransferInput,
  InventoryLedgerRow,
  ListInventoryQuery,
  LockedInventory,
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
  const rows = await tx.$queryRaw<LockedInventory[]>`SELECT id, "quantityAvailable", "quantityReserved" FROM "Inventory" WHERE "variantId" = ${variantId} AND "warehouseId" = ${warehouseId} FOR UPDATE`;

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
    SELECT id, "variantId", "warehouseId", "quantityAvailable", "quantityReserved"
    FROM "Inventory"
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
    FROM "Inventory" i
    WHERE i."warehouseId" = (
      SELECT id
      FROM "Warehouse"
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
    UPDATE "Inventory" AS i
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
      UPDATE "Inventory" AS i
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
    UPDATE "Inventory" AS i
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
      UPDATE "Inventory" AS i
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
    UPDATE "Inventory" AS i
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
  const search = query.search?.trim();
  const where: Record<string, unknown> = {
    ...(query.warehouseId && { warehouseId: query.warehouseId }),
    ...(query.variantId && { variantId: query.variantId }),
    ...(query.lowStockOnly && {
      quantityAvailable: { lt: env.LOW_STOCK_THRESHOLD },
    }),
    ...(search && {
      OR: [
        { variant: { sku: { contains: search, mode: "insensitive" } } },
        {
          variant: {
            product: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        variant: {
          select: {
            id: true,
            sku: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.inventory.count({ where }),
  ]);

  return {
    ...paginated(items, query.page, query.limit, total),
    lowStockThreshold: env.LOW_STOCK_THRESHOLD,
  };
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

export const approveInventoryAdjustment = async (
  adjustmentId: string,
  approved: boolean,
  approvedBy: string
) => {
  return transaction(async (tx) => {
    const adjustment = await tx.inventoryAdjustment.findUnique({
      where: { id: adjustmentId },
    });

    if (!adjustment) throw new AppError("Adjustment not found", 404);
    if (adjustment.status !== "PENDING") {
      throw new AppError("Adjustment already processed", 400);
    }

    if (!approved) {
      return tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: "REJECTED", approvedBy },
      });
    }

    const invRow = await tx.$queryRaw<
      Array<{ id: string; quantityOnHand: number; quantityAvailable: number }>
    >`SELECT id, "quantityOnHand", "quantityAvailable" FROM "Inventory" WHERE "variantId" = ${adjustment.variantId} AND "warehouseId" = ${adjustment.warehouseId} FOR UPDATE`;

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

    return tx.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: { status: "APPROVED", approvedBy },
    });
  });
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
  return transaction(async (tx) => {
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

    return tx.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: "COMPLETED" },
    });
  });
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
