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

describe("COD initiate", () => {
  it("returns 401 without auth", async () => {
    const res = await api()
      .post("/api/v1/payments/00000000-0000-0000-0000-000000000001/initiate")
      .send({ method: "COD" });

    expect(res.status).toBe(401);
  });

  it("returns 404 for another user's order", async () => {
    const owner = await createTestUser(tracker, { suffix: `own-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `oth-${Date.now()}` });
    const order = await createTestOrder(tracker, owner);

    const res = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", other.cookie)
      .send({ method: "COD" });

    expect(res.status).toBe(404);
  });

  it("initiates COD for own order", async () => {
    const user = await createTestUser(tracker, { suffix: `cod-${Date.now()}` });
    const order = await createTestOrder(tracker, user);

    const res = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", user.cookie)
      .send({ method: "COD" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.method).toBe("COD");
    expect(res.body.data.payment.status).toBe("PENDING");
    tracker.paymentIds.push(res.body.data.payment.id);
  });
});

describe("Payment initiation idempotency", () => {
  it("reuses the active payment instead of creating a duplicate", async () => {
    const user = await createTestUser(tracker, { suffix: `idem-${Date.now()}` });
    const order = await createTestOrder(tracker, user);

    const first = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", user.cookie)
      .send({ method: "COD" });

    expect(first.status).toBe(201);
    tracker.paymentIds.push(first.body.data.payment.id);

    const second = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", user.cookie)
      .send({ method: "COD" });

    expect(second.status).toBe(201);
    expect(second.body.data.payment.id).toBe(first.body.data.payment.id);

    const count = await prisma.payment.count({
      where: { orderId: order.id, method: "COD", deletedAt: null },
    });
    expect(count).toBe(1);
  });
});

describe("COD collect", () => {
  it("returns 403 for non-admin", async () => {
    const user = await createTestUser(tracker, { suffix: `na-${Date.now()}` });
    const order = await createTestOrder(tracker, user);

    const initiated = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", user.cookie)
      .send({ method: "COD" });

    expect(initiated.status).toBe(201);
    const paymentId = initiated.body.data.payment.id as string;
    tracker.paymentIds.push(paymentId);

    const res = await api()
      .post(`/api/v1/admin/payments/cod/${paymentId}/collect`)
      .set("Cookie", user.cookie);

    expect(res.status).toBe(403);
  });

  it("collects COD as admin", async () => {
    const user = await createTestUser(tracker, { suffix: `cu-${Date.now()}` });
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ad-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, user);

    const initiated = await api()
      .post(`/api/v1/payments/${order.id}/initiate`)
      .set("Cookie", user.cookie)
      .send({ method: "COD" });

    expect(initiated.status).toBe(201);
    const paymentId = initiated.body.data.payment.id as string;
    tracker.paymentIds.push(paymentId);

    const res = await api()
      .post(`/api/v1/admin/payments/cod/${paymentId}/collect`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("COLLECTED");

    const notification = await prisma.notification.findFirst({
      where: { userId: user.id },
      include: { template: true },
    });
    expect(notification).not.toBeNull();
    expect(notification?.status).toBe("PENDING");
    expect(notification?.template?.code).toBe("PAYMENT_CONFIRMATION");
    expect(notification?.subject).toContain(order.orderNumber);
  });
});

describe("Admin payment reads", () => {
  it("returns 401 without auth", async () => {
    const list = await api().get("/api/v1/admin/payments");
    expect(list.status).toBe(401);

    const detail = await api().get("/api/v1/admin/payments/test-id");
    expect(detail.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const user = await createTestUser(tracker, { suffix: `payu-${Date.now()}` });
    const list = await api()
      .get("/api/v1/admin/payments")
      .set("Cookie", user.cookie);
    expect(list.status).toBe(403);
  });

  it("returns payment detail with gatewayResponse for admin", async () => {
    const user = await createTestUser(tracker, { suffix: `payc-${Date.now()}` });
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `paya-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, user);
    const payment = await createSslcommerzPayment(tracker, order.id, {
      amount: 150,
      status: "INITIATED",
    });

    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        status: "INITIATED",
        amount: 150,
        transactionReference: payment.providerReference,
        gatewayResponse: { val_id: "test-gateway", status: "VALID" },
      },
    });

    const list = await api()
      .get("/api/v1/admin/payments")
      .query({ method: "SSLCOMMERZ", status: "INITIATED", page: 1, limit: 1 })
      .set("Cookie", admin.cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.pagination).toBeDefined();
    expect(list.body.data.items[0]).toHaveProperty("valId");
    expect(list.body.data.items[0]).toHaveProperty("bankTranId");

    const detail = await api()
      .get(`/api/v1/admin/payments/${payment.id}`)
      .set("Cookie", admin.cookie);

    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe(payment.id);
    expect(detail.body.data).toHaveProperty("valId");
    expect(detail.body.data).toHaveProperty("bankTranId");
    expect(detail.body.data.transactions[0].gatewayResponse).toEqual({
      val_id: "test-gateway",
      status: "VALID",
    });
  });
});
