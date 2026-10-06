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

export const createVariantInventory = async (
  tx: TransactionClient,
  warehouseId: string,
  variantId: string,
): Promise<void> => {
  await tx.inventory.create({
    data: {
      warehouseId,
      variantId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
    },
  });
};

export const createVariantInventories = async (
  tx: TransactionClient,
  warehouseId: string,
  variantIds: string[],
): Promise<void> => {
  if (!variantIds.length) return;
  await tx.inventory.createMany({
    data: variantIds.map((variantId) => ({
      warehouseId,
      variantId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
    })),
  });
};
