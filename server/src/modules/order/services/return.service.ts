import { prisma, transaction, type TransactionClient } from "../../../lib/prisma.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import {
  applyInventoryRestocks,
  lockCheckoutInventory,
} from "../../catalog/inventory/services/inventory.service.ts";
import { reverseCouponUsage } from "../../coupon/coupon.service.ts";
import type {
  CreateReturnRequestInput,
  InventoryTxn,
  ListReturnRequestsQuery,
  ReviewReturnRequestInput,
} from "../types.ts";
import { fromMinor, lineAmountsForRange, toMinor } from "../utils/order-helpers.ts";
import { isReturnWindowOpen } from "../utils/return-window.ts";
import { notifyOrderStatusChange } from "../../notification/services/notification.service.ts";

const returnInclude = {
  items: {
    include: {
      orderItem: {
        select: {
          id: true,
          productName: true,
          sku: true,
          variantName: true,
          unitPrice: true,
          subtotal: true,
        },
      },
    },
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerProfileId: true,
      customerProfile: {
        select: {
          id: true,
          customerCode: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
} as const;

export const createReturnRequest = async (
  customerProfileId: string,
  orderId: string,
  input: CreateReturnRequestInput
) => {
  const created = await transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, customerProfileId, deletedAt: null },
      include: { items: true },
    });

    if (!order) throw new AppError("Order not found", 404);

    if (order.status !== "DELIVERED") {
      throw new AppError("Return requests are only allowed for delivered orders", 400);
    }

    if (!order.deliveredAt) {
      throw new AppError("Order has no delivery timestamp", 400);
    }

    if (!isReturnWindowOpen(order.deliveredAt)) {
      throw new AppError("The return window has expired", 400);
    }

    const existingPending = await tx.returnRequest.findFirst({
      where: { orderId: order.id, status: "PENDING" },
      select: { id: true },
    });

    if (existingPending) {
      throw new AppError("A pending return request already exists for this order", 409);
    }

    const orderItemById = new Map(order.items.map((item) => [item.id, item]));
    const requestedOrderItemIds = input.items.map((item) => item.orderItemId);
    const previouslyApprovedItems = await tx.returnItem.findMany({
      where: {
        orderItemId: { in: requestedOrderItemIds },
        returnRequest: { status: "APPROVED" },
      },
      select: { orderItemId: true, quantity: true },
    });
    const approvedQtyByOrderItem = new Map<string, number>();
    for (const row of previouslyApprovedItems) {
      approvedQtyByOrderItem.set(
        row.orderItemId,
        (approvedQtyByOrderItem.get(row.orderItemId) ?? 0) + row.quantity
      );
    }

    for (const item of input.items) {
      const orderItem = orderItemById.get(item.orderItemId);
      if (!orderItem) {
        throw new AppError("Order item does not belong to this order", 400);
      }
      const alreadyReturned = approvedQtyByOrderItem.get(item.orderItemId) ?? 0;
      if (item.quantity + alreadyReturned > orderItem.quantity) {
        throw new AppError(
          `Return quantity exceeds remaining returnable quantity for item ${orderItem.sku}`,
          400
        );
      }
    }

    const returnRequest = await tx.returnRequest.create({
      data: {
        orderId: order.id,
        reason: input.reason ?? null,
        status: "PENDING",
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            restockOrRefund: item.restockOrRefund,
          })),
        },
      },
      include: returnInclude,
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: "RETURN_REQUESTED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "RETURN_REQUESTED",
        remarks: input.reason ?? "Return requested by customer",
        changedBy: customerProfileId,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: "RETURN_REQUESTED",
        metadata: { returnRequestId: returnRequest.id },
      },
    });

    return returnRequest;
  });

  await notifyOrderStatusChange(created.orderId, "RETURN_REQUESTED");
  return created;
};

export const listReturnRequests = async (query: ListReturnRequestsQuery) => {
  const where: Prisma.ReturnRequestWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.orderId) {
    where.orderId = query.orderId;
  }

  const [items, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include: returnInclude,
      orderBy: { requestedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.returnRequest.count({ where }),
  ]);

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

const applyApprovedReturn = async (
  tx: TransactionClient,
  returnRequestId: string,
  orderId: string,
  adminNote: string | undefined,
  actorId: string,
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    restockOrRefund: string;
  }>,
  overrides: Array<{
    orderItemId: string;
    restockToStock?: boolean | undefined;
    damaged?: boolean | undefined;
  }> = [],
) => {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  const orderItems = await tx.orderItem.findMany({
    where: { id: { in: items.map((item) => item.orderItemId) } },
  });
  const orderItemById = new Map(orderItems.map((item) => [item.id, item]));
  const overrideByOrderItem = new Map(
    overrides.map((override) => [override.orderItemId, override]),
  );

  const [allOrderItems, approvedReturnItems] = await Promise.all([
    tx.orderItem.findMany({
      where: { orderId },
      select: { quantity: true },
    }),
    tx.returnItem.findMany({
      where: { returnRequest: { orderId, status: "APPROVED" } },
      select: { orderItemId: true, quantity: true },
    }),
  ]);

  const orderedQuantity = allOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const returnedQuantity = approvedReturnItems.reduce((sum, item) => sum + item.quantity, 0);
  const isFullReturn = orderedQuantity > 0 && returnedQuantity >= orderedQuantity;

  if (items.length === 0) return { isFullReturn };

  // Quantities already approved for each line before this request. The current
  // request is already APPROVED at this point, so subtract its own quantity.
  const approvedByOrderItem = new Map<string, number>();
  for (const row of approvedReturnItems) {
    approvedByOrderItem.set(
      row.orderItemId,
      (approvedByOrderItem.get(row.orderItemId) ?? 0) + row.quantity,
    );
  }

  const restockItems: Array<{
    orderItemId: string;
    quantity: number;
    orderItem: (typeof orderItems)[number];
  }> = [];
  const returnItemUpdates: Array<{
    where: { id: string };
    data: Prisma.ReturnItemUpdateInput;
  }> = [];
  let refundAmountMinor = 0;
  let hasKnownCost = true;

  for (const item of items) {
    const orderItem = orderItemById.get(item.orderItemId);
    if (!orderItem) continue;

    const override = overrideByOrderItem.get(item.orderItemId);
    const restockToStock =
      override?.restockToStock ?? item.restockOrRefund === "RESTOCK";
    const damaged = override?.damaged ?? false;
    const resalable = restockToStock && !damaged;

    const previousQuantity =
      (approvedByOrderItem.get(item.orderItemId) ?? 0) - item.quantity;
    const amounts = lineAmountsForRange(
      order,
      orderItem,
      Math.max(0, previousQuantity),
      item.quantity,
    );
    if (amounts.costMinor === null) hasKnownCost = false;

    refundAmountMinor += amounts.cashRefundMinor;
    returnItemUpdates.push({
      where: { id: item.id },
      data: {
        restockToStock,
        damaged,
        salesAdjustmentAmount: fromMinor(amounts.netSalesMinor),
        costAdjustmentAmount: fromMinor(
          resalable ? amounts.costMinor ?? 0 : 0,
        ),
        allocationVersion: 1,
      },
    });

    if (resalable) {
      restockItems.push({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        orderItem,
      });
    }
  }

  await Promise.all(
    returnItemUpdates.map((update) => tx.returnItem.update(update)),
  );

  if (restockItems.length > 0) {
    const restockVariantIds = restockItems
      .map((item) => item.orderItem.variantId)
      .filter((id): id is string => Boolean(id));
    const { warehouseId, rows } = await lockCheckoutInventory(tx, restockVariantIds);
    if (!warehouseId) throw new AppError("No active warehouse configured", 500);

    const inventoryByVariant = new Map(
      rows.map((row) => [row.variantId ?? "", row]),
    );
    const restockTransactions: InventoryTxn[] = [];
    const restockUpdates: Array<{ id: string; quantity: number }> = [];

    for (const item of restockItems) {
      if (!item.orderItem.variantId) continue;

      const invRow = inventoryByVariant.get(item.orderItem.variantId);
      if (!invRow) {
        throw new AppError(
          `No inventory record for returned item ${item.orderItem.sku}`,
          409,
        );
      }

      restockUpdates.push({ id: invRow.id, quantity: item.quantity });
      restockTransactions.push({
        inventoryId: invRow.id,
        variantId: item.orderItem.variantId,
        warehouseId,
        type: "RETURN_IN",
        quantity: item.quantity,
        referenceType: "RETURN_REQUEST",
        referenceId: returnRequestId,
        remarks: adminNote ?? "Return approved; resalable stock restocked",
        createdBy: actorId,
      });
    }

    await applyInventoryRestocks(tx, restockUpdates);

    if (restockTransactions.length > 0) {
      await tx.inventoryTransaction.createMany({ data: restockTransactions });
    }
  }

  const shippingRefundMinor = isFullReturn ? toMinor(order.shippingAmount) : 0;
  if (shippingRefundMinor > 0) {
    refundAmountMinor += shippingRefundMinor;
    await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: { shippingRefundAmount: fromMinor(shippingRefundMinor) },
    });
  }

  if (refundAmountMinor <= 0) return { isFullReturn };

  const payment = await tx.payment.findFirst({
    where: {
      orderId,
      deletedAt: null,
      status: { notIn: ["PENDING", "INITIATED", "FAILED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    // Unpaid COD orders still need their stock and sales adjusted, but there is
    // no captured cash to refund. Record that explicitly instead of blocking
    // the return.
    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: "RETURN_APPROVED",
        metadata: {
          returnRequestId,
          refundSkipped: true,
          reason: "NO_REFUNDABLE_PAYMENT",
          refundAmount: fromMinor(refundAmountMinor),
          initiatedBy: actorId,
        },
      },
    });
    return { isFullReturn };
  }

  // Serialize refund creation per payment so two returns approved at the same
  // time cannot refund more than was captured.
  await tx.$queryRaw`SELECT id FROM "payment" WHERE id = ${payment.id} FOR UPDATE`;
  const reservedAgg = await tx.refund.aggregate({
    where: {
      paymentId: payment.id,
      status: { in: ["PENDING", "APPROVED", "PROCESSING", "COMPLETED"] },
    },
    _sum: { amount: true },
  });
  const remainingRefundableMinor = Math.max(
    0,
    toMinor(payment.amount) - toMinor(reservedAgg._sum.amount ?? 0),
  );
  const refundMinor = Math.min(refundAmountMinor, remainingRefundableMinor);

  if (refundMinor <= 0) {
    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: "RETURN_APPROVED",
        metadata: {
          returnRequestId,
          refundSkipped: true,
          reason: "PAYMENT_FULLY_REFUNDED",
          refundAmount: fromMinor(refundAmountMinor),
          initiatedBy: actorId,
        },
      },
    });
    return { isFullReturn };
  }

  // SSLCommerz exposes a refund API, but it requires the gateway `bank_tran_id`
  // which is not persisted in this codebase. Until that is captured and a
  // provider-level refund method is wired in, refunds are queued for manual
  // processing by an admin (status stays PENDING + explicit flag).
  const refund = await tx.refund.create({
    data: {
      paymentId: payment.id,
      returnRequestId,
      amount: fromMinor(refundMinor),
      reason: `Return request ${returnRequestId}`,
      status: "PENDING",
      requiresManualProcessing: true,
      requestedBy: actorId,
    },
  });

  await tx.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: "REFUND_CREATED",
      metadata: {
        refundId: refund.id,
        amount: fromMinor(refundMinor),
        requestedRefundAmount: fromMinor(refundAmountMinor),
        refundCapped: refundMinor < refundAmountMinor,
        returnRequestId,
        requiresManualProcessing: true,
        initiatedBy: actorId,
        fullReturn: isFullReturn,
        costCoverageComplete: hasKnownCost,
      },
    },
  });

  return { isFullReturn };
};

export const reviewReturnRequest = async (
  returnRequestId: string,
  input: ReviewReturnRequestInput,
  actorId: string
) => {
  const result = await transaction(async (tx) => {
    let fullReturn = false;
    // Serialize concurrent reviews of the same request. Without this lock two
    // approvals could both pass the PENDING check and double-restock/refund.
    await tx.$queryRaw`SELECT id FROM "return_request" WHERE id = ${returnRequestId} FOR UPDATE`;
    const returnRequest = await tx.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: returnInclude,
    });

    if (!returnRequest) throw new AppError("Return request not found", 404);

    if (returnRequest.status !== "PENDING") {
      throw new AppError("Return request has already been reviewed", 400);
    }

    if (input.items) {
      const knownOrderItemIds = new Set(
        returnRequest.items.map((item) => item.orderItemId),
      );
      const unknown = input.items.find(
        (item) => !knownOrderItemIds.has(item.orderItemId),
      );
      if (unknown) {
        throw new AppError(
          "Reviewed item does not belong to this return request",
          400,
        );
      }
    }

    const updated = await tx.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        status: input.status,
        adminNote: input.adminNote ?? null,
        reviewedAt: new Date(),
        reviewedBy: actorId,
      },
      include: returnInclude,
    });

    if (input.status === "APPROVED") {
      const { isFullReturn } = await applyApprovedReturn(
        tx,
        returnRequest.id,
        returnRequest.orderId,
        input.adminNote,
        actorId,
        returnRequest.items,
        input.items ?? [],
      );
      fullReturn = isFullReturn;

      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: {
          status: isFullReturn ? "RETURNED" : "DELIVERED",
          fulfillmentStatus: isFullReturn
            ? "FULFILLED"
            : "PARTIALLY_FULFILLED",
        },
      });

      if (isFullReturn) {
        await reverseCouponUsage(tx, returnRequest.orderId);

        await tx.orderStatusHistory.create({
          data: {
            orderId: returnRequest.orderId,
            status: "RETURNED",
            remarks: input.adminNote ?? "Return approved",
            changedBy: actorId,
          },
        });
      } else {
        await tx.orderStatusHistory.create({
          data: {
            orderId: returnRequest.orderId,
            status: "DELIVERED",
            remarks: input.adminNote ?? "Return partially approved",
            changedBy: actorId,
          },
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId: returnRequest.orderId,
          eventType: "RETURN_APPROVED",
          metadata: {
            returnRequestId: returnRequest.id,
            reviewedBy: actorId,
            fullReturn: isFullReturn,
          },
        },
      });
    }

    if (input.status === "REJECTED") {
      if (returnRequest.order.status === "RETURN_REQUESTED") {
        await tx.order.update({
          where: { id: returnRequest.orderId },
          data: { status: "DELIVERED" },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: returnRequest.orderId,
            status: "DELIVERED",
            remarks: input.adminNote ?? "Return rejected",
            changedBy: actorId,
          },
        });
      }
    }

    return { updated, fullReturn };
  });

  if (result.fullReturn) {
    await notifyOrderStatusChange(result.updated.orderId, "RETURNED");
  }

  return result.updated;
};
