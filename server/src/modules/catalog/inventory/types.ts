import type { InventoryTransactionType } from "../../../generated/prisma/enums.ts";
import type { z } from "zod";
import type {
  approveInventoryAdjustmentSchema,
  createInventoryAdjustmentSchema,
  createInventoryTransferSchema,
  listInventoryQuerySchema,
} from "./validators/inventory.validators.ts";

export type CreateInventoryAdjustmentInput = z.infer<typeof createInventoryAdjustmentSchema>;
export type CreateInventoryTransferInput = z.infer<typeof createInventoryTransferSchema>;
export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;
export type ApproveAdjustmentInput = z.infer<typeof approveInventoryAdjustmentSchema>;

export type LockedInventory = {
  id: string;
  variantId?: string;
  warehouseId?: string;
  quantityAvailable: number;
  quantityReserved?: number;
  quantityOnHand?: number;
};

export type InventoryLedgerRow = {
  inventoryId: string;
  variantId: string;
  warehouseId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceType: string;
  referenceId: string;
  remarks?: string;
  createdBy: string;
};
