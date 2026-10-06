import { AppError } from "../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import { prisma, transaction } from "../../../lib/prisma.ts";
import { commitOrderStock } from "../../catalog/inventory/services/inventory.service.ts";
import { enqueuePaymentConfirmation } from "../../notification/services/notification.service.ts";
import { sslcommerzProvider } from "../providers/sslcommerz.provider.ts";
import type {
  SslcommerzFailCancelInput,
  SslcommerzIpnInput,
  SslcommerzSuccessInput,
} from "../types.ts";

const findPaymentByProviderReference = async (tranId: string) => {
  if (!tranId) throw new AppError("Payment reference is missing", 400);

  const payment = await prisma.payment.findUnique({
    where: { providerReference: tranId },
  });

  if (!payment) throw new AppError("Payment not found", 404);

  return payment;
};

const toCustomerPayment = (payment: {
  id: string;
  method: string;
  status: string;
  amount: unknown;
  currency: string;
  createdAt: Date;
  orderId: string;
}) => ({
  id: payment.id,
  method: payment.method,
  status: payment.status,
  amount: payment.amount,
  currency: payment.currency,
  createdAt: payment.createdAt,
  orderId: payment.orderId,
});

const assertAmountMatches = (expected: number, actual?: number) => {
  if (actual !== undefined && Math.abs(actual - expected) > 0.01) {
    throw new AppError(
      `Transaction amount ${actual} does not match payment amount ${expected}`,
      400,
    );
  }
};

const readBankTranId = (raw: unknown): string | null => {
  if (!raw || typeof raw !== "object") return null;
  const value = (raw as Record<string, unknown>).bank_tran_id;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const handleSslcommerzSuccess = async (
  input: SslcommerzSuccessInput,
) => {
  const payment = await findPaymentByProviderReference(input.tran_id);
  return { payment: toCustomerPayment(payment) };
};

export const handleSslcommerzFail = async (
  input: SslcommerzFailCancelInput,
) => {
  const payment = await findPaymentByProviderReference(input.tran_id);
  return { payment: toCustomerPayment(payment) };
};

export const handleSslcommerzCancel = async (
  input: SslcommerzFailCancelInput,
) => {
  const payment = await findPaymentByProviderReference(input.tran_id);
  return { payment: toCustomerPayment(payment) };
};

const toStringRecord = (input: SslcommerzIpnInput): Record<string, string> => {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    record[key] = String(value);
  }
  return record;
};

export const handleSslcommerzIpn = async (input: SslcommerzIpnInput) => {
  const payload = toStringRecord(input);
  const signatureValid = sslcommerzProvider.verifyWebhookSignature(payload);

  if (!signatureValid) {
    throw new AppError("Invalid SSLCommerz webhook signature", 401);
  }

  const statusValue = payload.status;
  const tranId = payload.tran_id;
  if (!statusValue || !tranId) {
    throw new AppError(
      "SSLCommerz webhook status and transaction ID are required",
      400,
    );
  }

  const status = statusValue.toUpperCase();
  const isSuccess = status === "VALID" || status === "VALIDATED";
  const eventId = payload.val_id || `${status}:${tranId}`;

  const webhookLog = await prisma.paymentWebhookLog.upsert({
    where: {
      provider_externalEventId: {
        provider: "SSLCOMMERZ",
        externalEventId: eventId,
      },
    },
    update: {},
    create: {
      provider: "SSLCOMMERZ",
      eventType: "ipn",
      externalEventId: eventId,
      payload: input as unknown as object,
      processed: false,
    },
  });

  if (webhookLog.processed) {
    return { alreadyProcessed: true };
  }

  if (!isSuccess) {
    const mappedStatus = status === "CANCELLED" ? "CANCELLED" : "FAILED";
    const eventType =
      mappedStatus === "CANCELLED" ? "PAYMENT_CANCELLED" : "PAYMENT_FAILED";

    const result = await transaction(async (tx) => {
      const lockedPayments = await tx.$queryRaw<
        Array<{
          id: string;
          method: string;
          status: string;
          amount: unknown;
          currency: string;
          createdAt: Date;
          orderId: string;
        }>
      >`SELECT id, method, status, amount, currency, "createdAt", "orderId" FROM "Payment" WHERE "providerReference" = ${tranId} AND "deletedAt" IS NULL FOR UPDATE`;
      const payment = lockedPayments[0];
      if (!payment) throw new AppError("Payment not found", 404);

      const claim = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: ["INITIATED", "PENDING"] },
        },
        data: { status: mappedStatus },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType,
          metadata: { source: "sslcommerz-ipn", status },
        },
      });

      await tx.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true, processedAt: new Date() },
      });

      return {
        payment: toCustomerPayment({
          ...payment,
          status: claim.count > 0 ? mappedStatus : payment.status,
        }),
        alreadyProcessed: false as const,
      };
    });

    return result;
  }

  const valId = payload.val_id;
  if (!valId) throw new AppError("val_id is required", 400);

  const verification = await sslcommerzProvider.verifyTransaction(valId);

  if (!verification.valid) {
    throw new AppError("Transaction verification failed", 400);
  }

  const bankTranId = readBankTranId(verification.raw);

  let result;
  try {
    result = await transaction(async (tx) => {
      const lockedPayments = await tx.$queryRaw<
        Array<{
          id: string;
          method: string;
          status: string;
          amount: unknown;
          currency: string;
          createdAt: Date;
          orderId: string;
          paidAt: Date | null;
        }>
      >`SELECT id, method, status, amount, currency, "createdAt", "orderId", "paidAt" FROM "Payment" WHERE "providerReference" = ${tranId} AND "deletedAt" IS NULL FOR UPDATE`;
      const payment = lockedPayments[0];

      if (!payment) throw new AppError("Payment not found", 404);

      const lockedOrders = await tx.$queryRaw<
        Array<{
          id: string;
          orderNumber: string;
          status: string;
          paymentStatus: string;
          customerProfileId: string;
        }>
      >`SELECT id, "orderNumber", status, "paymentStatus", "customerProfileId" FROM "Order" WHERE id = ${payment.orderId} AND "deletedAt" IS NULL FOR UPDATE`;

      assertAmountMatches(Number(payment.amount), verification.amount);

      const order = lockedOrders[0];

      if (!order) throw new AppError("Order not found", 404);

      if (
        order.status === "CANCELLED" ||
        order.status === "REFUNDED" ||
        order.paymentStatus === "FAILED"
      ) {
        await tx.paymentWebhookLog.update({
          where: { id: webhookLog.id },
          data: { processed: true, processedAt: new Date() },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "PAYMENT_FAILED",
            metadata: {
              source: "sslcommerz-ipn",
              reason: "late-ipn-after-cancel",
              valId,
            },
          },
        });

        return {
          payment: toCustomerPayment(payment),
          alreadyProcessed: true as const,
        };
      }

      const claim = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: ["INITIATED", "PENDING"] },
        },
        data: {
          status: "SUCCESS",
          paidAt: payment.paidAt ?? new Date(),
          valId,
          ...(bankTranId ? { bankTranId } : {}),
        },
      });

      if (claim.count === 0) {
        await tx.paymentWebhookLog.update({
          where: { id: webhookLog.id },
          data: { processed: true, processedAt: new Date() },
        });

        return {
          payment: toCustomerPayment(payment),
          alreadyProcessed: true as const,
        };
      }

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "PAYMENT_SUCCESS",
          metadata: {
            source: "sslcommerz-ipn",
            valId,
            verified: true,
          },
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionReference: verification.transactionId,
          gatewayResponse: verification.raw as object,
          status: "SUCCESS",
          amount: Number(payment.amount),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      await commitOrderStock(
        tx,
        order.id,
        order.orderNumber,
        "system:sslcommerz-ipn",
      );

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          eventType: "PAYMENT_RECEIVED",
          metadata: { paymentId: payment.id, source: "sslcommerz-ipn" },
        },
      });

      await tx.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true, processedAt: new Date() },
      });

      return {
        payment: toCustomerPayment({ ...payment, status: "SUCCESS" }),
        alreadyProcessed: false as const,
        orderNumber: order.orderNumber,
        customerProfileId: order.customerProfileId,
        amount: Number(payment.amount).toFixed(2),
        currency: payment.currency,
        method: payment.method,
      };
    });
  } catch (err) {
    if (!isPrismaCode(err, "P2002")) throw err;

    await prisma.paymentWebhookLog.update({
      where: { id: webhookLog.id },
      data: { processed: true, processedAt: new Date() },
    });

    const existing = await findPaymentByProviderReference(tranId);
    return {
      payment: toCustomerPayment(existing),
      alreadyProcessed: true as const,
    };
  }

  if (!result.alreadyProcessed) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: result.customerProfileId },
      select: { userId: true, user: { select: { name: true } } },
    });
    if (profile) {
      await enqueuePaymentConfirmation(profile.userId, {
        customerName: profile.user.name,
        orderNumber: result.orderNumber,
        amount: result.amount,
        currency: result.currency,
        method: result.method,
      });
    }
  }

  return {
    payment: result.payment,
    alreadyProcessed: result.alreadyProcessed,
  };
};
