import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createSslcommerzPayment,
  createTestOrder,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const setupPayment = async (suffix: string, amount = 100) => {
  const user = await createTestUser(tracker, { suffix: `${suffix}-${Date.now()}` });
  const order = await createTestOrder(tracker, user, {
    status: "CONFIRMED",
    grandTotal: amount,
  });
  const payment = await createSslcommerzPayment(tracker, order.id, { amount });
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", paidAt: new Date() },
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID" },
  });
  const admin = await createTestUser(tracker, {
    role: "ADMIN",
    suffix: `refund-admin-${suffix}-${Date.now()}`,
  });
  const approver = await createTestUser(tracker, {
    role: "ADMIN",
    suffix: `refund-approver-${suffix}-${Date.now()}`,
  });
  return { user, order, payment, admin, approver };
};

const createRefund = (
  adminCookie: string,
  paymentId: string,
  amount: number,
) =>
  api()
    .post(`/api/v1/admin/payments/${paymentId}/refund`)
    .set("Cookie", adminCookie)
    .send({ amount, reason: "test refund" });

const moveRefund = (
  adminCookie: string,
  refundId: string,
  status: string,
) =>
  api()
    .patch(`/api/v1/admin/refunds/${refundId}`)
    .set("Cookie", adminCookie)
    .send({ status });

describe("refund lifecycle", () => {
  it("caps refunds against the payment and excludes rejected refunds", async () => {
    const { payment, admin, approver } = await setupPayment("cap");

    const first = await createRefund(admin.cookie, payment.id, 60);
    expect(first.status).toBe(201);
    expect(first.body.data.requiresManualProcessing).toBe(true);

    const tooMuch = await createRefund(admin.cookie, payment.id, 50);
    expect(tooMuch.status).toBe(400);

    const rejected = await moveRefund(
      approver.cookie,
      first.body.data.id,
      "REJECTED",
    );
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.requiresManualProcessing).toBe(true);

    const full = await createRefund(admin.cookie, payment.id, 100);
    expect(full.status).toBe(201);
  });

  it("syncs payment and order status when refunds complete", async () => {
    const { order, payment, admin, approver } = await setupPayment("complete");

    const first = await createRefund(admin.cookie, payment.id, 40);
    await moveRefund(approver.cookie, first.body.data.id, "APPROVED");
    const completedFirst = await moveRefund(
      admin.cookie,
      first.body.data.id,
      "COMPLETED",
    );
    expect(completedFirst.status).toBe(200);
    expect(completedFirst.body.data.requiresManualProcessing).toBe(false);

    let persistedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    let persistedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(persistedPayment.status).toBe("PARTIALLY_REFUNDED");
    expect(persistedOrder.paymentStatus).toBe("PAID");

    const second = await createRefund(admin.cookie, payment.id, 60);
    await moveRefund(approver.cookie, second.body.data.id, "APPROVED");
    const completedSecond = await moveRefund(
      admin.cookie,
      second.body.data.id,
      "COMPLETED",
    );
    expect(completedSecond.status).toBe(200);

    persistedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    persistedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(persistedPayment.status).toBe("REFUNDED");
    expect(persistedOrder.paymentStatus).toBe("REFUNDED");
  });

  it("prevents the requester from approving their own refund", async () => {
    const { payment, admin } = await setupPayment("self-approve");
    const refund = await createRefund(admin.cookie, payment.id, 25);

    const res = await moveRefund(admin.cookie, refund.body.data.id, "APPROVED");
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("REFUND_MAKER_CHECKER");
  });

  it("rejects invalid refund transitions", async () => {
    const { payment, admin } = await setupPayment("invalid");
    const refund = await createRefund(admin.cookie, payment.id, 10);

    const res = await moveRefund(admin.cookie, refund.body.data.id, "COMPLETED");
    expect(res.status).toBe(409);

    const persisted = await prisma.refund.findUniqueOrThrow({
      where: { id: refund.body.data.id },
    });
    expect(persisted.status).toBe("PENDING");
  });
});
