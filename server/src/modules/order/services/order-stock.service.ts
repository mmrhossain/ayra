import type { TransactionClient } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  applyInventoryReleases,
  applyInventoryReservations,
  lockCheckoutInventory,
  lockInventoryForVariants,
} from "../../catalog/inventory/services/inventory.service.ts";
import type { InventoryTxn, StockReservationDraft } from "../types.ts";
import { RESERVATION_TTL_MS } from "../utils/order-helpers.ts";

export const releaseOrderStock = async (
    tx: TransactionClient,
    orderId: string,
    orderNumber: string,
    actorId: string,
    remarks: string
) => {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId },
  });
  if (reservations.length === 0) return;

  const sorted = [...reservations].sort((a, b) =>
    a.warehouseId === b.warehouseId
      ? a.variantId.localeCompare(b.variantId)
      : a.warehouseId.localeCompare(b.warehouseId)
  );

  const warehouseIds = [...new Set(sorted.map((row) => row.warehouseId))].sort((a, b) =>
    a.localeCompare(b),
  );
  const inventoryByKey = new Map<string, { id: string }>();
  for (const warehouseId of warehouseIds) {
    const variantIds = sorted
      .filter((row) => row.warehouseId === warehouseId)
      .map((row) => row.variantId);
    const lockedRows = await lockInventoryForVariants(tx, warehouseId, variantIds);
    for (const row of lockedRows) {
      inventoryByKey.set(`${row.warehouseId}:${row.variantId}`, row);
    }
  }

  const transactions: InventoryTxn[] = [];
  const releaseUpdates: Array<{ id: string; quantity: number }> = [];

  for (const reservation of sorted) {
    const invRow = inventoryByKey.get(`${reservation.warehouseId}:${reservation.variantId}`);
    if (!invRow) continue;

    releaseUpdates.push({ id: invRow.id, quantity: reservation.quantity });

    transactions.push({
      inventoryId: invRow.id,
      variantId: reservation.variantId,
      warehouseId: reservation.warehouseId,
      type: "RELEASE",
      quantity: reservation.quantity,
      referenceType: "ORDER",
      referenceId: orderNumber,
      remarks,
      createdBy: actorId,
    });
  }

  await applyInventoryReleases(tx, releaseUpdates);

  if (transactions.length > 0) {
    await tx.inventoryTransaction.createMany({ data: transactions });
  }

  await tx.stockReservation.deleteMany({ where: { orderId } });
};

type ReserveItem = {
  sku: string;
  quantity: number;
  variantId: string;
};

export const reserveCheckoutStock = async (
  tx: TransactionClient,
  items: ReserveItem[],
  orderNumber: string,
  customerProfileId: string,
): Promise<{
  reservations: StockReservationDraft[];
  inventoryTransactionsData: InventoryTxn[];
}> => {
  const sortedItems = [...items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId)
  );

  const { warehouseId, rows: lockedRows } = await lockCheckoutInventory(
    tx,
    sortedItems.map((item) => item.variantId),
  );
  if (!warehouseId) throw new AppError("No active warehouse configured", 500);

  const inventoryByVariant = new Map(
    lockedRows.map((row) => [row.variantId, row]),
  );

  const reservations: StockReservationDraft[] = [];
  const inventoryTransactionsData: InventoryTxn[] = [];
  const reservationUpdates: Array<{ id: string; quantity: number }> = [];
  const reservedAvailable = new Map<string, number>();

  for (const item of sortedItems) {
    const invRow = inventoryByVariant.get(item.variantId);
    if (!invRow) throw new AppError(`No inventory record for variant ${item.sku}`, 409);

    const remaining =
      reservedAvailable.get(invRow.id) ?? invRow.quantityAvailable;
    if (remaining < item.quantity) {
      throw new AppError(
          `Insufficient stock for ${item.sku} (requested ${item.quantity}, available ${remaining})`,
          409
      );
    }
    reservedAvailable.set(invRow.id, remaining - item.quantity);

    reservationUpdates.push({ id: invRow.id, quantity: item.quantity });

    inventoryTransactionsData.push({
      inventoryId: invRow.id,
      variantId: item.variantId,
      warehouseId,
      type: "RESERVE",
      quantity: item.quantity,
      referenceType: "ORDER",
      referenceId: orderNumber,
      createdBy: customerProfileId,
    });

    reservations.push({
      variantId: item.variantId,
      quantity: item.quantity,
      inventoryId: invRow.id,
      warehouseId,
      expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
    });
  }

  await applyInventoryReservations(tx, reservationUpdates);

  return { reservations, inventoryTransactionsData };
};
