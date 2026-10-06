import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";

export const createInventoryAdjustmentSchema = z.object({
  warehouseId: z.string().min(1),
  variantId: z.string().min(1),
  difference: z.coerce.number().int(),
  reason: z.string().min(1),
});

export const approveInventoryAdjustmentSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().optional(),
});

export const inventoryTransferItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const createInventoryTransferSchema = z.object({
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  remarks: z.string().optional(),
  items: z.array(inventoryTransferItemSchema).min(1),
});

export const listInventoryQuerySchema = paginationQuerySchema.extend({
  warehouseId: z.string().optional(),
  variantId: z.string().optional(),
  search: z.string().trim().min(1).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});
