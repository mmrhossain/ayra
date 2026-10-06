import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createSslcommerzPayment,
  createTestOrder,
  createTestProduct,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const isoDay = (d: Date) => d.toISOString();

describe("Analytics auth guard", () => {
  it("returns 401 without auth and 403 for non-admin", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `an-c-${Date.now()}`,
    });
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `an-v-${Date.now()}`,
    });

    const unauth = await api().get("/api/v1/admin/analytics/overview");
    expect(unauth.status).toBe(401);

    const customerRes = await api()
      .get("/api/v1/admin/analytics/overview")
      .set("Cookie", customer.cookie);
    expect(customerRes.status).toBe(403);

    const vendorRes = await api()
      .get("/api/v1/admin/analytics/overview")
      .set("Cookie", vendor.cookie);
    expect(vendorRes.status).toBe(403);
  });

  it("returns 200 for admin", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `an-a-${Date.now()}`,
    });

    const res = await api()
      .get("/api/v1/admin/analytics/overview")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalRevenue: expect.any(Number),
      totalOrders: expect.any(Number),
      pendingPaymentsCount: expect.any(Number),
      lowStockCount: expect.any(Number),
      newCustomersCount: expect.any(Number),
      averageOrderValue: expect.any(Number),
    });
  });
});

describe("Analytics overview aggregates", () => {
  it("computes totalRevenue and totalOrders from confirmed/paid orders in range", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `an-o-${Date.now()}`,
    });
    const buyer = await createTestUser(tracker, {
      suffix: `an-b-${Date.now()}`,
    });

    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const query = { dateFrom: isoDay(from), dateTo: isoDay(to) };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", admin.cookie);
    expect(before.status).toBe(200);

    await createTestOrder(tracker, buyer, {
      status: "CONFIRMED",
      grandTotal: 200,
    });
    await createTestOrder(tracker, buyer, {
      status: "CONFIRMED",
      grandTotal: 150,
    });
    await createTestOrder(tracker, buyer, {
      status: "PENDING",
      grandTotal: 999,
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", admin.cookie);

    expect(after.status).toBe(200);
    expect(after.body.data.totalRevenue - before.body.data.totalRevenue).toBe(
      350
    );
    expect(after.body.data.totalOrders - before.body.data.totalOrders).toBe(2);
  });

  it("filters overview by date range", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `an-d-${Date.now()}`,
    });
    const buyer = await createTestUser(tracker, {
      suffix: `an-db-${Date.now()}`,
    });

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = new Date();
    const query = { dateFrom: isoDay(from), dateTo: isoDay(to) };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", admin.cookie);
    expect(before.status).toBe(200);

    await createTestOrder(tracker, buyer, {
      status: "CONFIRMED",
      grandTotal: 80,
    });
    const old = await createTestOrder(tracker, buyer, {
      status: "CONFIRMED",
      grandTotal: 500,
    });
    await prisma.order.update({
      where: { id: old.id },
      data: { createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", admin.cookie);

    expect(after.status).toBe(200);
    expect(after.body.data.totalRevenue - before.body.data.totalRevenue).toBe(
      80
    );
    expect(after.body.data.totalOrders - before.body.data.totalOrders).toBe(1);
  });

  it("counts pending/initiated payments and low stock", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `an-p-${Date.now()}`,
    });
    const buyer = await createTestUser(tracker, {
      suffix: `an-pb-${Date.now()}`,
    });

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ lowStockThreshold: 10 })
      .set("Cookie", admin.cookie);
    expect(before.status).toBe(200);

    const order = await createTestOrder(tracker, buyer, {
      status: "PENDING",
      grandTotal: 100,
    });
    await createSslcommerzPayment(tracker, order.id, { status: "PENDING" });
    await createTestProduct(tracker, { stock: 2 });
    await createTestUser(tracker, { suffix: `an-nc-${Date.now()}` });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ lowStockThreshold: 10 })
      .set("Cookie", admin.cookie);

    expect(after.status).toBe(200);
    expect(
      after.body.data.pendingPaymentsCount - before.body.data.pendingPaymentsCount
    ).toBeGreaterThanOrEqual(1);
    expect(
      after.body.data.lowStockCount - before.body.data.lowStockCount
    ).toBeGreaterThanOrEqual(1);
    expect(
      after.body.data.newCustomersCount - before.body.data.newCustomersCount
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("Analytics validation", () => {
  it("rejects inverted or oversized date ranges", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `an-val-${Date.now()}`,
    });

    const inverted = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({
        dateFrom: "2026-06-01T00:00:00.000Z",
        dateTo: "2026-01-01T00:00:00.000Z",
      })
      .set("Cookie", admin.cookie);
    expect(inverted.status).toBe(400);

    const tooWide = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({
        dateFrom: "2020-01-01T00:00:00.000Z",
        dateTo: "2026-01-02T00:00:00.000Z",
      })
      .set("Cookie", admin.cookie);
    expect(tooWide.status).toBe(400);
  });
});
