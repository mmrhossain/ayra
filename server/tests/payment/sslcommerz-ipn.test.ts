import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { sslcommerzProvider } from "../../src/modules/payment/providers/sslcommerz.provider.ts";
import {
  CleanupTracker,
  api,
  createSslcommerzPayment,
  createTestOrder,
  createTestUser,
  sslcommerzIpnBody,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  vi.restoreAllMocks();
  await tracker.cleanup();
});

const mockVerify = (
  amount: number,
  tranId: string,
  opts?: { bankTranId?: string | null },
) => {
  const raw: Record<string, unknown> = {
    status: "VALID",
    tran_id: tranId,
    amount: String(amount),
  };
  if (opts?.bankTranId !== null) {
    raw.bank_tran_id = opts?.bankTranId ?? `BANK-${tranId}`;
  }

  vi.spyOn(sslcommerzProvider, "verifyTransaction").mockResolvedValue({
    valid: true,
    providerReference: tranId,
    transactionId: tranId,
    amount,
    currency: "BDT",
    raw,
  });
};

describe("SSLCommerz IPN", () => {
  it("rejects payload without signature", async () => {
    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send({ val_id: "v1", tran_id: "t1" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects invalid signature", async () => {
    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send({
        status: "VALID",
        val_id: "v-bad",
        tran_id: "t-bad",
        verify_key: "status,val_id,tran_id",
        verify_sign: "not-a-valid-md5-signature",
      });

    expect(res.status).toBe(401);
  });

  it("updates payment status on valid signature", async () => {
    const user = await createTestUser(tracker, { suffix: `ipn-${Date.now()}` });
    const order = await createTestOrder(tracker, user, { grandTotal: 100 });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 100,
    });

    const valId = `VAL-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: payment.providerReference as string,
      status: "VALID",
      amount: "100.00",
    };
    const payload = sslcommerzIpnBody(unsigned);

    mockVerify(100, payment.providerReference as string);

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyProcessed).toBe(false);
    expect(res.body.data.payment.status).toBe("SUCCESS");

    const updated = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(updated.status).toBe("SUCCESS");
    expect(updated.valId).toBe(valId);
    expect(updated.bankTranId).toBe(`BANK-${payment.providerReference}`);
    expect(res.body.data.payment).not.toHaveProperty("valId");
    expect(res.body.data.payment).not.toHaveProperty("bankTranId");

    const notification = await prisma.notification.findFirst({
      where: { userId: user.id },
      include: { template: true },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe("PENDING");
    expect(notification?.template?.code).toBe("PAYMENT_CONFIRMATION");
    expect(notification?.subject).toContain(order.orderNumber);

    const log = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: valId },
    });
    if (log) tracker.webhookLogIds.push(log.id);
  });

  it("is idempotent for duplicate IPN events", async () => {
    const user = await createTestUser(tracker, { suffix: `dup-${Date.now()}` });
    const order = await createTestOrder(tracker, user, { grandTotal: 100 });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 100,
    });

    const valId = `VAL-DUP-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: payment.providerReference as string,
      status: "VALID",
      amount: "100.00",
    };
    const payload = sslcommerzIpnBody(unsigned);

    mockVerify(100, payment.providerReference as string);

    const first = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(payload);
    expect(first.status).toBe(200);
    expect(first.body.data.alreadyProcessed).toBe(false);

    const second = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(payload);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyProcessed).toBe(true);

    const events = await prisma.paymentEvent.findMany({
      where: { paymentId: payment.id, eventType: "PAYMENT_SUCCESS" },
    });
    expect(events.length).toBe(1);

    const persisted = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(persisted.valId).toBe(valId);
    expect(persisted.bankTranId).toBe(`BANK-${payment.providerReference}`);

    const log = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: valId },
    });
    if (log) tracker.webhookLogIds.push(log.id);
  });

  it("does not mark failed verification as processed", async () => {
    const user = await createTestUser(tracker, { suffix: `failv-${Date.now()}` });
    const order = await createTestOrder(tracker, user, { grandTotal: 100 });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 100,
    });

    const valId = `VAL-FAIL-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: payment.providerReference as string,
      status: "VALID",
      amount: "100.00",
    };

    vi.spyOn(sslcommerzProvider, "verifyTransaction").mockResolvedValue({
      valid: false,
      providerReference: payment.providerReference as string,
      transactionId: payment.providerReference as string,
      amount: 100,
      currency: "BDT",
      raw: { status: "INVALID" },
    });

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(sslcommerzIpnBody(unsigned));

    expect(res.status).toBe(400);

    const log = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: valId },
    });
    expect(log).not.toBeNull();
    expect(log?.processed).toBe(false);
    if (log) tracker.webhookLogIds.push(log.id);

    const unchanged = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(unchanged.status).toBe("INITIATED");
    expect(unchanged.valId).toBeNull();
    expect(unchanged.bankTranId).toBeNull();
  });

  it("stores valId and leaves bankTranId null when bank_tran_id is missing", async () => {
    const user = await createTestUser(tracker, { suffix: `nobank-${Date.now()}` });
    const order = await createTestOrder(tracker, user, { grandTotal: 100 });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 100,
    });

    const valId = `VAL-NOBANK-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: payment.providerReference as string,
      status: "VALID",
      amount: "100.00",
    };

    mockVerify(100, payment.providerReference as string, { bankTranId: null });

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(sslcommerzIpnBody(unsigned));

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyProcessed).toBe(false);
    expect(res.body.data.payment.status).toBe("SUCCESS");

    const updated = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(updated.status).toBe("SUCCESS");
    expect(updated.valId).toBe(valId);
    expect(updated.bankTranId).toBeNull();

    const log = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: valId },
    });
    if (log) tracker.webhookLogIds.push(log.id);
  });

  it("returns alreadyProcessed on duplicate bankTranId without crashing IPN", async () => {
    const user = await createTestUser(tracker, { suffix: `p2002-${Date.now()}` });
    const firstOrder = await createTestOrder(tracker, user, { grandTotal: 100 });
    const secondOrder = await createTestOrder(tracker, user, { grandTotal: 100 });
    const first = await createSslcommerzPayment(tracker, firstOrder.id, {
      amount: 100,
    });
    const second = await createSslcommerzPayment(tracker, secondOrder.id, {
      amount: 100,
    });

    const sharedBankTranId = `BANK-DUP-${Date.now()}`;
    const firstValId = `VAL-P2002-A-${Date.now()}`;
    mockVerify(100, first.providerReference as string, {
      bankTranId: sharedBankTranId,
    });

    const firstRes = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(
        sslcommerzIpnBody({
          val_id: firstValId,
          tran_id: first.providerReference as string,
          status: "VALID",
          amount: "100.00",
        }),
      );
    expect(firstRes.status).toBe(200);
    expect(firstRes.body.data.alreadyProcessed).toBe(false);

    const secondValId = `VAL-P2002-B-${Date.now()}`;
    mockVerify(100, second.providerReference as string, {
      bankTranId: sharedBankTranId,
    });

    const secondRes = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(
        sslcommerzIpnBody({
          val_id: secondValId,
          tran_id: second.providerReference as string,
          status: "VALID",
          amount: "100.00",
        }),
      );

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.data.alreadyProcessed).toBe(true);

    const firstPersisted = await prisma.payment.findUniqueOrThrow({
      where: { id: first.id },
    });
    const secondPersisted = await prisma.payment.findUniqueOrThrow({
      where: { id: second.id },
    });
    expect(firstPersisted.status).toBe("SUCCESS");
    expect(firstPersisted.bankTranId).toBe(sharedBankTranId);
    expect(secondPersisted.status).toBe("INITIATED");
    expect(secondPersisted.valId).toBeNull();
    expect(secondPersisted.bankTranId).toBeNull();

    const firstLog = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: firstValId },
    });
    const secondLog = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: secondValId },
    });
    expect(secondLog?.processed).toBe(true);
    if (firstLog) tracker.webhookLogIds.push(firstLog.id);
    if (secondLog) tracker.webhookLogIds.push(secondLog.id);
  });

  it("does not resurrect a cancelled order on late IPN", async () => {
    const user = await createTestUser(tracker, { suffix: `late-${Date.now()}` });
    const order = await createTestOrder(tracker, user, { grandTotal: 100 });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 100,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });

    const valId = `VAL-LATE-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: payment.providerReference as string,
      status: "VALID",
      amount: "100.00",
    };
    mockVerify(100, payment.providerReference as string);

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(sslcommerzIpnBody(unsigned));

    expect(res.status).toBe(200);
    expect(res.body.data.alreadyProcessed).toBe(true);

    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(persisted.status).toBe("CANCELLED");
    expect(persisted.paymentStatus).toBe("FAILED");

    const unchanged = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    expect(unchanged.status).toBe("INITIATED");

    const log = await prisma.paymentWebhookLog.findFirst({
      where: { provider: "SSLCOMMERZ", externalEventId: valId },
    });
    if (log) tracker.webhookLogIds.push(log.id);
  });
});
