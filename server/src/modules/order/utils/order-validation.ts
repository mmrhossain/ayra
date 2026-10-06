import type { OrderEventType, OrderStatus, PaymentStatus } from "../../../generated/prisma/enums.ts";
import { AppError } from "../../../common/errors/AppError.ts";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "REFUNDED", "CANCELLED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const STATUS_EVENTS: Partial<Record<OrderStatus, OrderEventType>> = {
  CONFIRMED: "ORDER_CONFIRMED",
  PACKED: "ORDER_PACKED",
  SHIPPED: "ORDER_SHIPPED",
  DELIVERED: "ORDER_DELIVERED",
  CANCELLED: "ORDER_CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURN_APPROVED",
  REFUNDED: "REFUND_COMPLETED",
};

type CheckoutCartItem = {
  sku: string;
  variant: {
    deletedAt: Date | null;
    product: { status: string; deletedAt: Date | null };
  } | null;
};

export const assertCheckoutItemsAvailable = (items: CheckoutCartItem[]) => {
  for (const item of items) {
    if (!item.variant || item.variant.deletedAt) {
      throw new AppError(`Variant unavailable: ${item.sku}`, 409);
    }
    if (item.variant.product.status !== "ACTIVE" || item.variant.product.deletedAt) {
      throw new AppError(`Product unavailable: ${item.sku}`, 409);
    }
  }
};

export const assertStatusTransition = (
  from: OrderStatus,
  to: OrderStatus,
) => {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AppError(
        `Invalid status transition from ${from} to ${to}`,
        400
    );
  }
};

export const assertUnpaidConfirmAllowed = (
  paymentStatus: PaymentStatus,
  payments: Array<{ method: string }>,
) => {
  if (paymentStatus === "PAID") return;
  const isCod = payments.some((payment) => payment.method === "COD");
  if (!isCod) {
    throw new AppError(
      "Cannot confirm unpaid order until payment is complete",
      400
    );
  }
};

export const assertUnpaidCancelAllowed = (paymentStatus: PaymentStatus) => {
  if (paymentStatus === "PAID" || paymentStatus === "PARTIALLY_PAID") {
    throw new AppError(
        "Paid orders cannot be cancelled. Request a refund instead.",
        400
    );
  }
};

export const assertCustomerCancelStatus = (status: OrderStatus) => {
  if (status !== "PENDING" && status !== "CONFIRMED") {
    throw new AppError(
        "Order can only be cancelled in PENDING or CONFIRMED status",
        400
    );
  }
};
