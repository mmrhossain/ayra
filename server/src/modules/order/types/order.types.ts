import type { InventoryTransactionType, OrderStatus } from "../../../generated/prisma/enums.ts";
import type { z } from "zod";
import type { CheckoutInput } from "../../cart/types.ts";
import type {
  cancelOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validators.ts";
import type {
  createReturnRequestSchema,
  listReturnRequestsQuerySchema,
  reviewReturnRequestSchema,
} from "../validators/return.validators.ts";

export type { CheckoutInput };

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
export type ListReturnRequestsQuery = z.infer<typeof listReturnRequestsQuerySchema>;
export type ReviewReturnRequestInput = z.infer<typeof reviewReturnRequestSchema>;

export type StatusHistoryEntry = {
  id: string;
  status: OrderStatus;
  remarks: string | null;
  createdAt: Date;
};

export type InventoryTxn = {
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

export type StockReservationDraft = {
  variantId: string;
  quantity: number;
  inventoryId: string;
  warehouseId: string;
  expiresAt: Date;
};
