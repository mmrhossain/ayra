import { AppError } from "../../../../common/errors/AppError.ts";
import type { TransactionClient } from "../../../../lib/prisma.ts";
import { getDefaultWarehouse } from "../../inventory/services/inventory.service.ts";

export const requireWarehouse = async (tx: TransactionClient) => {
  const warehouse = await getDefaultWarehouse(tx);
  if (!warehouse) {
    throw new AppError("No active warehouse found — create a warehouse first", 400);
  }
  return warehouse;
};

export const requireActiveWarehouses = async (tx: TransactionClient) => {
  const warehouses = await tx.warehouse.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!warehouses.length) {
    throw new AppError("No active warehouse found — create a warehouse first", 400);
  }
  return warehouses;
};

export const createVariantInventory = async (
  tx: TransactionClient,
  variantId: string,
  warehouses?: Array<{ id: string }>,
): Promise<void> => {
  await createVariantInventories(tx, [variantId], warehouses);
};

export const createVariantInventories = async (
  tx: TransactionClient,
  variantIds: string[],
  warehouses?: Array<{ id: string }>,
): Promise<void> => {
  if (!variantIds.length) return;
  const active = warehouses ?? (await requireActiveWarehouses(tx));
  await tx.inventory.createMany({
    data: active.flatMap((warehouse) =>
      variantIds.map((variantId) => ({
        warehouseId: warehouse.id,
        variantId,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
      })),
    ),
    skipDuplicates: true,
  });
};
