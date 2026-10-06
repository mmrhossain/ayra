import { prisma, transaction, type TransactionClient } from "../../../lib/prisma.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import {
  applyInventoryRestocks,
  lockCheckoutInventory,
} from "../../catalog/inventory/services/inventory.service.ts";
import type {
  CreateReturnRequestInput,
  InventoryTxn,
  ListReturnRequestsQuery,
  ReviewReturnRequestInput,
} from "../types.ts";

const returnInclude = {
  items: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerProfileId: true,
    },
  },
} as const;

export const createReturnRequest = async (
  customerProfileId: string,
  orderId: string,
  input: CreateReturnRequestInput
) => {
  return transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, customerProfileId, deletedAt: null },
      include: { items: true },
    });

    if (!order) throw new AppError("Order not found", 404);

    if (order.status !== "DELIVERED") {
      throw new AppError("Return requests are only allowed for delivered orders", 400);
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
  items: Array<{ orderItemId: string; quantity: number; restockOrRefund: string }>,
) => {
  if (items.length === 0) return;

  const orderItems = await tx.orderItem.findMany({
    where: { id: { in: items.map((item) => item.orderItemId) } },
  });
  const orderItemById = new Map(orderItems.map((item) => [item.id, item]));

  const restockItems = items.filter((item) => item.restockOrRefund === "RESTOCK");
  if (restockItems.length > 0) {
    const restockVariantIds = restockItems
      .map((item) => orderItemById.get(item.orderItemId)?.variantId)
      .filter((id): id is string => Boolean(id));
    const { warehouseId, rows } = await lockCheckoutInventory(tx, restockVariantIds);
    if (!warehouseId) throw new AppError("No active warehouse configured", 500);

    const inventoryByVariant = new Map(rows.map((row) => [row.variantId ?? "", row]));
    const restockTransactions: InventoryTxn[] = [];
    const restockUpdates: Array<{ id: string; quantity: number }> = [];

    for (const item of restockItems) {
      const orderItem = orderItemById.get(item.orderItemId);
      if (!orderItem?.variantId) continue;

      const invRow = inventoryByVariant.get(orderItem.variantId);
      if (!invRow) {
        throw new AppError(`No inventory record for returned item ${orderItem.sku}`, 409);
      }

      restockUpdates.push({ id: invRow.id, quantity: item.quantity });
      restockTransactions.push({
        inventoryId: invRow.id,
        variantId: orderItem.variantId,
        warehouseId,
        type: "RETURN_IN",
        quantity: item.quantity,
        referenceType: "RETURN_REQUEST",
        referenceId: returnRequestId,
        remarks: adminNote ?? "Return approved; stock restocked",
        createdBy: actorId,
      });
    }

    await applyInventoryRestocks(tx, restockUpdates);

    if (restockTransactions.length > 0) {
      await tx.inventoryTransaction.createMany({ data: restockTransactions });
    }
  }

  const refundItems = items.filter((item) => item.restockOrRefund === "REFUND");
  if (refundItems.length === 0) return;

  const refundAmount = refundItems.reduce((sum, item) => {
    const orderItem = orderItemById.get(item.orderItemId);
    return sum + (orderItem ? Number(orderItem.unitPrice) * item.quantity : 0);
  }, 0);

  if (refundAmount <= 0) return;

  const payment = await tx.payment.findFirst({
    where: {
      orderId,
      deletedAt: null,
      status: { notIn: ["PENDING", "INITIATED", "FAILED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) throw new AppError("No refundable payment found for this order", 400);

  // SSLCommerz exposes a refund API, but it requires the gateway `bank_tran_id`
  // which is not persisted in this codebase. Until that is captured and a
  // provider-level refund method is wired in, refunds are queued for manual
  // processing by an admin (status stays PENDING + explicit flag).
  const refund = await tx.refund.create({
    data: {
      paymentId: payment.id,
      amount: refundAmount,
      reason: `Return request ${returnRequestId}`,
      status: "PENDING",
      requiresManualProcessing: true,
    },
  });

  await tx.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: "REFUND_CREATED",
      metadata: {
        refundId: refund.id,
        amount: refundAmount,
        returnRequestId,
        requiresManualProcessing: true,
        initiatedBy: actorId,
      },
    },
  });
};

export const reviewReturnRequest = async (
  returnRequestId: string,
  input: ReviewReturnRequestInput,
  actorId: string
) => {
  return transaction(async (tx) => {
    const returnRequest = await tx.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: returnInclude,
    });

    if (!returnRequest) throw new AppError("Return request not found", 404);

    if (returnRequest.status !== "PENDING") {
      throw new AppError("Return request has already been reviewed", 400);
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
      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: { status: "RETURNED" },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: returnRequest.orderId,
          status: "RETURNED",
          remarks: input.adminNote ?? "Return approved",
          changedBy: actorId,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: returnRequest.orderId,
          eventType: "RETURN_APPROVED",
          metadata: { returnRequestId: returnRequest.id, reviewedBy: actorId },
        },
      });

      await applyApprovedReturn(
        tx,
        returnRequest.id,
        returnRequest.orderId,
        input.adminNote,
        actorId,
        returnRequest.items,
      );
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

    return updated;
  });
};
