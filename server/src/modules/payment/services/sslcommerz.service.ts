import { AppError } from "../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import { prisma, transaction } from "../../../lib/prisma.ts";
import { commitOrderStock } from "../../catalog/inventory/services/inventory.service.ts";
import { enqueuePaymentConfirmation } from "../../notification/services/notification.service.ts";
import { escapeHtml } from "../../../template/email.ts";
import { sslcommerzProvider } from "../providers/sslcommerz.provider.ts";
import type {
  SslcommerzFailCancelInput,
  SslcommerzIpnInput,
  SslcommerzSuccessInput,
} from "../types.ts";

type SettlementSource = "sslcommerz-ipn" | "sslcommerz-success";

type LockedPayment = {
  id: string;
  method: string;
  status: string;
  amount: unknown;
  currency: string;
  createdAt: Date;
  orderId: string;
  paidAt: Date | null;
};

type SettlementResult = {
  payment: ReturnType<typeof toCustomerPayment>;
  alreadyProcessed: boolean;
  orderNumber?: string;
  customerProfileId?: string;
  amount?: string;
  currency?: string;
  method?: string;
};

const findPaymentByProviderReference = async (tranId: string) => {
  if (!tranId) throw new AppError("Payment reference is missing", 400);

  const payment = await prisma.payment.findFirst({
    where: { providerReference: tranId, deletedAt: null },
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

const assertPaymentMatches = (
  payment: Pick<LockedPayment, "amount" | "currency">,
  verification: { amount?: number | undefined; currency?: string | undefined },
) => {
  if (verification.amount === undefined) {
    throw new AppError("Transaction amount is missing from the gateway", 400);
  }

  const expected = Number(payment.amount);
  if (Math.abs(verification.amount - expected) > 0.01) {
    throw new AppError(
      `Transaction amount ${verification.amount} does not match payment amount ${expected}`,
      400,
    );
  }

  if (!verification.currency || verification.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    throw new AppError(
      `Transaction currency ${verification.currency ?? "unknown"} does not match payment currency ${payment.currency}`,
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

const markWebhookProcessed = async (
  tx: Parameters<Parameters<typeof transaction>[0]>[0],
  webhookLogId: string | undefined,
) => {
  if (!webhookLogId) return;
  await tx.paymentWebhookLog.update({
    where: { id: webhookLogId },
    data: { processed: true, processedAt: new Date() },
  });
};

const notifyPaymentConfirmation = async (result: SettlementResult) => {
  if (result.alreadyProcessed || !result.customerProfileId) return;

  const profile = await prisma.customerProfile.findUnique({
    where: { id: result.customerProfileId },
    select: { userId: true, user: { select: { name: true } } },
  });

  if (!profile) return;

  await enqueuePaymentConfirmation(profile.userId, {
    customerName: escapeHtml(profile.user.name),
    orderNumber: result.orderNumber ?? "",
    amount: result.amount ?? "0.00",
    currency: result.currency ?? "BDT",
    method: result.method ?? "SSLCOMMERZ",
  });
};

const settleVerifiedPayment = async (input: {
  tranId: string;
  valId: string;
  verification: Awaited<
    ReturnType<typeof sslcommerzProvider.verifyTransaction>
  >;
  source: SettlementSource;
  webhookLogId?: string;
}): Promise<SettlementResult> => {
  const { tranId, valId, verification, source, webhookLogId } = input;
  const bankTranId = readBankTranId(verification.raw);

  try {
    const result = await transaction(async (tx) => {
      const lockedPayments = await tx.$queryRaw<LockedPayment[]>`
        SELECT id, method, status, amount, currency, "createdAt", "orderId", "paidAt"
        FROM "payment"
        WHERE "providerReference" = ${tranId} AND "deletedAt" IS NULL
        FOR UPDATE`;

      const payment = lockedPayments[0];
      if (!payment) throw new AppError("Payment not found", 404);

      await assertPaymentMatches(payment, verification);

      const lockedOrders = await tx.$queryRaw<
        Array<{
          id: string;
          orderNumber: string;
          status: string;
          paymentStatus: string;
          customerProfileId: string;
        }>
      >`
        SELECT id, "orderNumber", status, "paymentStatus", "customerProfileId"
        FROM "order"
        WHERE id = ${payment.orderId} AND "deletedAt" IS NULL
        FOR UPDATE`;

      const order = lockedOrders[0];
      if (!order) throw new AppError("Order not found", 404);

      if (
        order.status === "CANCELLED" ||
        order.status === "REFUNDED" ||
        order.paymentStatus === "FAILED"
      ) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            paidAt: payment.paidAt ?? new Date(),
            valId,
            ...(bankTranId ? { bankTranId } : {}),
          },
        });

        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            transactionReference: verification.transactionId ?? valId,
            gatewayResponse: verification.raw as object,
            status: "SUCCESS",
            amount: Number(payment.amount),
          },
        });

        const existingRefunds = await tx.refund.count({
          where: { paymentId: payment.id, status: { not: "REJECTED" } },
        });

        if (existingRefunds === 0) {
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              amount: Number(payment.amount),
              reason: "Payment received after the order was cancelled",
              status: "PENDING",
              requiresManualProcessing: true,
            },
          });
        }

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "PAYMENT_SUCCESS",
            metadata: {
              source,
              reason: "late-payment-after-cancel",
              valId,
              refundRequired: existingRefunds === 0,
            },
          },
        });

        await markWebhookProcessed(tx, webhookLogId);

        return {
          payment: toCustomerPayment({ ...payment, status: "SUCCESS" }),
          alreadyProcessed: true as const,
        };
      }

      const claim = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: ["INITIATED", "PENDING", "FAILED"] },
        },
        data: {
          status: "SUCCESS",
          paidAt: payment.paidAt ?? new Date(),
          valId,
          ...(bankTranId ? { bankTranId } : {}),
        },
      });

      if (claim.count === 0) {
        await markWebhookProcessed(tx, webhookLogId);
        return {
          payment: toCustomerPayment(payment),
          alreadyProcessed: true as const,
        };
      }

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "PAYMENT_SUCCESS",
          metadata: { source, valId, verified: true },
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionReference: verification.transactionId ?? valId,
          gatewayResponse: verification.raw as object,
          status: "SUCCESS",
          amount: Number(payment.amount),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });

      await commitOrderStock(tx, order.id, order.orderNumber, `system:${source}`);

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          eventType: "PAYMENT_RECEIVED",
          metadata: { paymentId: payment.id, source },
        },
      });

      await markWebhookProcessed(tx, webhookLogId);

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

    await notifyPaymentConfirmation(result);

    return result;
  } catch (error) {
    if (!isPrismaCode(error, "P2002")) throw error;

    await markWebhookProcessedOutsideTransaction(webhookLogId);
    const existing = await findPaymentByProviderReference(tranId);

    return {
      payment: toCustomerPayment(existing),
      alreadyProcessed: true,
    };
  }
};

const markWebhookProcessedOutsideTransaction = async (
  webhookLogId: string | undefined,
) => {
  if (!webhookLogId) return;
  await prisma.paymentWebhookLog.update({
    where: { id: webhookLogId },
    data: { processed: true, processedAt: new Date() },
  });
};

export const handleSslcommerzSuccess = async (
  input: SslcommerzSuccessInput,
) => {
  const payment = await findPaymentByProviderReference(input.tran_id);

  if (payment.status === "SUCCESS") {
    return { payment: toCustomerPayment(payment) };
  }

  const verification = await sslcommerzProvider.verifyTransaction(input.val_id);
  if (!verification.valid) {
    throw new AppError("Transaction verification failed", 400);
  }

  const result = await settleVerifiedPayment({
    tranId: input.tran_id,
    valId: input.val_id,
    verification,
    source: "sslcommerz-success",
  });

  return { payment: result.payment };
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
  const signatureValid = await sslcommerzProvider.verifyWebhookSignature(payload);

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
      const lockedPayments = await tx.$queryRaw<LockedPayment[]>`
        SELECT id, method, status, amount, currency, "createdAt", "orderId", "paidAt"
        FROM "payment"
        WHERE "providerReference" = ${tranId} AND "deletedAt" IS NULL
        FOR UPDATE`;
      const payment = lockedPayments[0];
      if (!payment) throw new AppError("Payment not found", 404);

      const claim = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: ["INITIATED", "PENDING"] },
        },
        data: { status: mappedStatus },
      });

      if (claim.count > 0) {
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType,
            metadata: { source: "sslcommerz-ipn", status },
          },
        });
      }

      await markWebhookProcessed(tx, webhookLog.id);

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

  const result = await settleVerifiedPayment({
    tranId,
    valId,
    verification,
    source: "sslcommerz-ipn",
    webhookLogId: webhookLog.id,
  });

  return {
    payment: result.payment,
    alreadyProcessed: result.alreadyProcessed,
  };
};
