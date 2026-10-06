import { randomUUID } from "node:crypto";
import { prisma, transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import type { PaymentMethod } from "../../../generated/prisma/enums.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { getPaymentProvider } from "../providers/index.ts";
import { getCallbackUrls } from "../providers/sslcommerz.provider.ts";
import { commitOrderStock } from "../../catalog/inventory/services/inventory.service.ts";
import { enqueuePaymentConfirmation } from "../../notification/services/notification.service.ts";
import type {
  GatewayOrder,
  ListPaymentsQuery,
  RefundInput,
} from "../types.ts";

const toProviderOrder = (order: {
  id: string;
  orderNumber: string;
  grandTotal: Prisma.Decimal;
  currency: string;
  addresses: Array<{
    type: "SHIPPING" | "BILLING";
    fullName: string;
    phone: string;
    email: string | null;
    country: string;
    division: string;
    district: string;
    postalCode: string | null;
    addressLine1: string;
  }>;
  customerProfile: {
    user: { name: string; email: string };
  };
}): GatewayOrder => {
  const shipping = order.addresses.find((a) => a.type === "SHIPPING");
  const billing = order.addresses.find((a) => a.type === "BILLING");
  const address = shipping ?? billing;
  const user = order.customerProfile.user;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    grandTotal: Number(order.grandTotal),
    currency: order.currency,
    customerName: address?.fullName ?? user.name,
    customerEmail: address?.email ?? user.email,
    customerPhone: address?.phone ?? "",
    customerAddress: address?.addressLine1 ?? undefined,
    customerCity: address?.district ?? undefined,
    customerPostCode: address?.postalCode ?? undefined,
    customerCountry: address?.country ?? undefined,
    customerState: address?.division ?? undefined,
    shippingName: shipping?.fullName ?? address?.fullName ?? undefined,
    shippingAddress: shipping?.addressLine1 ?? address?.addressLine1 ?? undefined,
    shippingCity: shipping?.district ?? address?.district ?? undefined,
    shippingState: shipping?.division ?? address?.division ?? undefined,
    shippingPostCode: shipping?.postalCode ?? address?.postalCode ?? undefined,
    shippingCountry: shipping?.country ?? address?.country ?? undefined,
    shippingPhone: shipping?.phone ?? address?.phone ?? undefined,
  };
};

/**
 * A payment that is still in flight: not terminal, not soft-deleted and not
 * past its provider expiry. Re-initiating returns this row instead of opening a
 * second gateway session / creating a duplicate Payment.
 */
const activePaymentWhere = (
  orderId: string,
  method: PaymentMethod
): Prisma.PaymentWhereInput => ({
  orderId,
  method,
  deletedAt: null,
  status: { in: ["PENDING", "INITIATED"] },
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

const toCustomerPayment = (payment: {
  id: string;
  method: string;
  status: string;
  amount: unknown;
  currency: string;
  createdAt: Date;
}) => ({
  id: payment.id,
  method: payment.method,
  status: payment.status,
  amount: payment.amount,
  currency: payment.currency,
  createdAt: payment.createdAt,
});

export const initiatePayment = async (
  customerProfileId: string,
  orderId: string,
  method: PaymentMethod
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerProfileId, deletedAt: null },
    include: {
      addresses: true,
      customerProfile: {
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new AppError("Cannot initiate payment for a cancelled order", 409);
  }
  if (order.paymentStatus === "PAID") {
    throw new AppError("Order is already paid", 409);
  }

  const reusable = await prisma.payment.findFirst({
    where: activePaymentWhere(order.id, method),
    orderBy: { createdAt: "desc" },
  });

  if (reusable?.checkoutUrl) {
    return {
      payment: toCustomerPayment(reusable),
      checkoutUrl: reusable.checkoutUrl,
    };
  }

  const provider = getPaymentProvider(method);
  const providerOrder = toProviderOrder(order);
  const callbacks = getCallbackUrls();

  if (method === "SSLCOMMERZ") {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    providerOrder.orderNumber = `${providerOrder.orderNumber}-${suffix}`;
  }

  const initiateResult = await provider.initiate(providerOrder, callbacks);

  return transaction(async (tx) => {
    // Serialize concurrent initiations for the same order so only one active
    // payment survives; the order row is the lock anchor.
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        status: string;
        paymentStatus: string;
      }>
    >`SELECT id, status, "paymentStatus" FROM "Order" WHERE id = ${order.id} AND "deletedAt" IS NULL FOR UPDATE`;
    const lockedOrder = lockedRows[0];
    if (!lockedOrder) throw new AppError("Order not found", 404);
    if (lockedOrder.status === "CANCELLED" || lockedOrder.status === "REFUNDED") {
      throw new AppError("Cannot initiate payment for a cancelled order", 409);
    }
    if (lockedOrder.paymentStatus === "PAID") {
      throw new AppError("Order is already paid", 409);
    }

    const raced = await tx.payment.findFirst({
      where: activePaymentWhere(order.id, method),
      orderBy: { createdAt: "desc" },
    });

    if (raced?.checkoutUrl) {
      return {
        payment: toCustomerPayment(raced),
        checkoutUrl: raced.checkoutUrl,
      };
    }

    if (raced && !raced.checkoutUrl) {
      const payment = await tx.payment.update({
        where: { id: raced.id },
        data: {
          status: initiateResult.paymentStatus,
          provider: method,
          checkoutUrl: initiateResult.checkoutUrl,
          ...(initiateResult.providerReference && {
            providerReference: initiateResult.providerReference,
          }),
          ...(initiateResult.expiresAt && { expiresAt: initiateResult.expiresAt }),
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "PAYMENT_PROCESSING",
          metadata: { method, initiatedBy: customerProfileId },
        },
      });

      return {
        payment: toCustomerPayment(payment),
        checkoutUrl: payment.checkoutUrl,
      };
    }

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method,
        status: initiateResult.paymentStatus,
        amount: Number(order.grandTotal),
        provider: method,
        checkoutUrl: initiateResult.checkoutUrl,
        ...(initiateResult.providerReference && {
          providerReference: initiateResult.providerReference,
        }),
        ...(initiateResult.expiresAt && { expiresAt: initiateResult.expiresAt }),
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "PAYMENT_CREATED",
        metadata: { method, initiatedBy: customerProfileId },
      },
    });

    return {
      payment: toCustomerPayment(payment),
      checkoutUrl: payment.checkoutUrl,
    };
  });
};

export const collectCodPayment = async (paymentId: string, actorId: string) => {
  const updated = await transaction(async (tx) => {
    const lockedPayments = await tx.$queryRaw<
      Array<{
        id: string;
        method: string;
        status: string;
        orderId: string;
      }>
    >`SELECT id, method, status, "orderId" FROM "Payment" WHERE id = ${paymentId} AND "deletedAt" IS NULL FOR UPDATE`;
    const payment = lockedPayments[0];

    if (!payment) throw new AppError("Payment not found", 404);
    if (payment.method !== "COD") throw new AppError("Not a COD payment", 400);
    if (payment.status !== "PENDING") {
      throw new AppError("Payment already processed", 409);
    }

    const lockedOrders = await tx.$queryRaw<
      Array<{
        id: string;
        orderNumber: string;
        status: string;
        paymentStatus: string;
      }>
    >`SELECT id, "orderNumber", status, "paymentStatus" FROM "Order" WHERE id = ${payment.orderId} AND "deletedAt" IS NULL FOR UPDATE`;
    const order = lockedOrders[0];

    if (!order) throw new AppError("Order not found", 404);
    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      throw new AppError("Cannot collect payment for a cancelled order", 409);
    }
    if (order.paymentStatus === "PAID") {
      throw new AppError("Order is already paid", 409);
    }

    const collected = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COLLECTED",
        paidAt: new Date(),
      },
      include: { order: true },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "PAYMENT_SUCCESS",
        metadata: { source: "cod-collect", collectedBy: actorId },
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    await commitOrderStock(tx, order.id, order.orderNumber, actorId);

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: "PAYMENT_RECEIVED",
        metadata: { paymentId: payment.id, source: "cod-collect" },
      },
    });

    return collected;
  });

  const profile = await prisma.customerProfile.findUnique({
    where: { id: updated.order.customerProfileId },
    select: { userId: true, user: { select: { name: true } } },
  });
  if (profile) {
    await enqueuePaymentConfirmation(profile.userId, {
      customerName: profile.user.name,
      orderNumber: updated.order.orderNumber,
      amount: Number(updated.amount).toFixed(2),
      currency: updated.currency,
      method: updated.method,
    });
  }

  return updated;
};

export const createRefund = async (
  paymentId: string,
  input: RefundInput,
  actorId: string
) => {
  return transaction(async (tx) => {
    const lockedPayments = await tx.$queryRaw<
      Array<{
        id: string;
        status: string;
        amount: { toNumber?: () => number } | number | string;
      }>
    >`SELECT id, status, amount FROM "Payment" WHERE id = ${paymentId} AND "deletedAt" IS NULL FOR UPDATE`;
    const payment = lockedPayments[0];

    if (!payment) throw new AppError("Payment not found", 404);

    if (
      payment.status === "PENDING" ||
      payment.status === "INITIATED" ||
      payment.status === "FAILED" ||
      payment.status === "CANCELLED"
    ) {
      throw new AppError("Payment is not in a refundable state", 400);
    }

    const refundAgg = await tx.refund.aggregate({
      where: { paymentId: payment.id },
      _sum: { amount: true },
    });
    const refundedTotal = Number(refundAgg._sum.amount ?? 0);

    if (refundedTotal + input.amount > Number(payment.amount)) {
      throw new AppError(
        "Refund amount exceeds the payment amount",
        400
      );
    }

    const refund = await tx.refund.create({
      data: {
        paymentId: payment.id,
        amount: input.amount,
        reason: input.reason ?? null,
        status: "PENDING",
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "REFUND_CREATED",
        metadata: {
          refundId: refund.id,
          amount: input.amount,
          initiatedBy: actorId,
        },
      },
    });

    return refund;
  });
};

const adminPaymentListSelect = {
  id: true,
  method: true,
  status: true,
  amount: true,
  currency: true,
  provider: true,
  providerReference: true,
  valId: true,
  bankTranId: true,
  paidAt: true,
  expiresAt: true,
  orderId: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
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

export const listPayments = async (query: ListPaymentsQuery) => {
  const where: Prisma.PaymentWhereInput = { deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.method) where.method = query.method;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: adminPaymentListSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

export const getPayment = async (paymentId: string) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, deletedAt: null },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          currency: true,
          customerProfile: {
            select: {
              id: true,
              customerCode: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          transactionReference: true,
          gatewayResponse: true,
          status: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      refunds: {
        orderBy: { createdAt: "desc" },
      },
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!payment) throw new AppError("Payment not found", 404);

  return payment;
};
