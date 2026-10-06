import { transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import type { OrderStatus, PaymentStatus } from "../../../generated/prisma/enums.ts";
import { reverseCouponUsage } from "../../coupon/coupon.service.ts";
import type { UpdateOrderStatusInput } from "../types.ts";
import { omitOrderCostPrice } from "../utils/order-helpers.ts";
import {
  assertCustomerCancelStatus,
  assertStatusTransition,
  assertUnpaidCancelAllowed,
  assertUnpaidConfirmAllowed,
  STATUS_EVENTS,
} from "../utils/order-validation.ts";
import { releaseOrderStock } from "./order-stock.service.ts";

export const updateOrderStatus = async (
    orderId: string,
    input: UpdateOrderStatusInput,
    actorId: string
) => {
  return transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{
        id: string;
        orderNumber: string;
        status: OrderStatus;
        paymentStatus: PaymentStatus;
      }>
    >`SELECT id, "orderNumber", status, "paymentStatus" FROM "Order" WHERE id = ${orderId} AND "deletedAt" IS NULL FOR UPDATE`;
    const order = locked[0];

    if (!order) throw new AppError("Order not found", 404);

    assertStatusTransition(order.status, input.status);

    if (input.status === "CONFIRMED" && order.paymentStatus !== "PAID") {
      const payments = await tx.payment.findMany({
        where: { orderId: order.id },
        select: { method: true },
      });
      assertUnpaidConfirmAllowed(order.paymentStatus, payments);
    }

    if (input.status === "CANCELLED") {
      assertUnpaidCancelAllowed(order.paymentStatus);

      await releaseOrderStock(
          tx,
          order.id,
          order.orderNumber,
          actorId,
          input.remarks ?? "Order cancelled by admin"
      );
      await reverseCouponUsage(tx, order.id);
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          status: { in: ["INITIATED", "PENDING"] },
          deletedAt: null,
        },
        data: { status: "CANCELLED" },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: input.status },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: input.status,
        remarks: input.remarks ?? null,
        changedBy: actorId,
      },
    });

    const eventType = STATUS_EVENTS[input.status];
    if (eventType) {
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          eventType,
          metadata: { fromStatus: order.status, changedBy: actorId },
        },
      });
    }

    return updated;
  });
};

export const cancelOrder = async (
    customerProfileId: string,
    orderId: string,
    reason?: string
) => {
  return transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{
        id: string;
        orderNumber: string;
        status: OrderStatus;
        paymentStatus: PaymentStatus;
      }>
    >`SELECT id, "orderNumber", status, "paymentStatus" FROM "Order" WHERE id = ${orderId} AND "customerProfileId" = ${customerProfileId} AND "deletedAt" IS NULL FOR UPDATE`;
    const order = locked[0];

    if (!order) throw new AppError("Order not found", 404);

    assertCustomerCancelStatus(order.status);
    assertUnpaidCancelAllowed(order.paymentStatus);

    await releaseOrderStock(
        tx,
        order.id,
        order.orderNumber,
        customerProfileId,
        reason ?? "Order cancelled, stock released"
    );
    await reverseCouponUsage(tx, order.id);
    await tx.payment.updateMany({
      where: {
        orderId: order.id,
        status: { in: ["INITIATED", "PENDING"] },
        deletedAt: null,
      },
      data: { status: "CANCELLED" },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    const sanitized = omitOrderCostPrice(updated);

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        remarks: reason ?? "Cancelled by customer",
        changedBy: customerProfileId,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: "ORDER_CANCELLED",
        metadata: {
          reason: reason ?? null,
          cancelledBy: customerProfileId,
        },
      },
    });

    return sanitized;
  });
};
