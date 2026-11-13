import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { allocateLineMoney } from "../../src/modules/order/utils/order-helpers.ts";
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

const addLine = async (
  orderId: string,
  opts: {
    sku?: string;
    quantity?: number;
    unitPrice?: number;
    costPrice?: number | null;
    discountAmount?: number;
    taxAmount?: number;
    allocationVersion?: number;
  } = {},
) => {
  const quantity = opts.quantity ?? 1;
  const unitPrice = opts.unitPrice ?? 100;
  return prisma.orderItem.create({
    data: {
      orderId,
      productName: opts.sku ?? "Test product",
      sku: opts.sku ?? `SKU-${Date.now()}-${Math.random()}`,
      quantity,
      unitPrice,
      costPrice: opts.costPrice === undefined ? 40 : opts.costPrice,
      discountAmount: opts.discountAmount ?? 0,
      taxAmount: opts.taxAmount ?? 0,
      allocationVersion: opts.allocationVersion ?? 1,
      subtotal: unitPrice * quantity,
    },
  });
};

const adminCookie = async (suffix: string) => {
  const admin = await createTestUser(tracker, {
    role: "ADMIN",
    suffix,
  });
  return admin.cookie;
};

describe("Analytics auth guard", () => {
  it("returns 401 without auth and 403 for non-admin", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `an-c-${Date.now()}`,
    });

    const unauth = await api().get("/api/v1/admin/analytics/overview");
    expect(unauth.status).toBe(401);

    const customerRes = await api()
      .get("/api/v1/admin/analytics/overview")
      .set("Cookie", customer.cookie);
    expect(customerRes.status).toBe(403);
  });

  it("returns named honest metrics for admin", async () => {
    const cookie = await adminCookie(`an-a-${Date.now()}`);

    const res = await api()
      .get("/api/v1/admin/analytics/overview")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      currency: "BDT",
      timezone: "Asia/Dhaka",
      grossProductSales: expect.any(Number),
      productDiscounts: expect.any(Number),
      taxAmount: expect.any(Number),
      netProductSales: expect.any(Number),
      knownCogs: expect.any(Number),
      estimatedGrossProfit: expect.any(Number),
      costCoveragePercent: expect.any(Number),
      costDataComplete: expect.any(Boolean),
      totalOrders: expect.any(Number),
      pendingPaymentsCount: expect.any(Number),
      lowStockCount: expect.any(Number),
      newCustomersCount: expect.any(Number),
      averageOrderValue: expect.any(Number),
      cashCollected: expect.any(Number),
      cashRefunded: expect.any(Number),
      outstandingCod: expect.any(Number),
    });
    expect(res.body.data.totalRevenue).toBeUndefined();
  });
});

describe("Analytics overview aggregates", () => {
  it("reports delivered net product sales, discounts, tax, COGS and shipping separately", async () => {
    const cookie = await adminCookie(`an-o-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-b-${Date.now()}`,
    });

    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);
    expect(before.status).toBe(200);

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 200,
      discountAmount: 20,
      taxAmount: 10,
      shippingAmount: 30,
      grandTotal: 220,
      pricesIncludeTax: false,
    });
    await addLine(order.id, {
      quantity: 2,
      unitPrice: 100,
      costPrice: 40,
      discountAmount: 20,
      taxAmount: 10,
    });
    await createTestOrder(tracker, buyer, {
      status: "PENDING",
      grandTotal: 999,
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(after.status).toBe(200);
    const data = after.body.data;
    expect(data.grossProductSales - before.body.data.grossProductSales).toBe(
      200,
    );
    expect(data.productDiscounts - before.body.data.productDiscounts).toBe(20);
    expect(data.taxAmount - before.body.data.taxAmount).toBe(10);
    // Prices exclude tax, so gross is already pre-tax: 200 - 20 discount.
    expect(data.netProductSales - before.body.data.netProductSales).toBe(180);
    expect(data.knownCogs - before.body.data.knownCogs).toBe(80);
    expect(
      data.estimatedGrossProfit - before.body.data.estimatedGrossProfit,
    ).toBe(100);
    expect(data.netShippingIncome - before.body.data.netShippingIncome).toBe(
      30,
    );
    expect(data.totalOrders - before.body.data.totalOrders).toBe(1);
    expect(data.costDataComplete).toBe(true);
  });

  it("does not add tax twice when prices already include tax", async () => {
    const cookie = await adminCookie(`an-inc-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-incb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };
    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 110,
      taxAmount: 10,
      grandTotal: 110,
      pricesIncludeTax: true,
    });
    await addLine(order.id, {
      quantity: 1,
      unitPrice: 110,
      costPrice: 50,
      taxAmount: 10,
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(
      after.body.data.netProductSales - before.body.data.netProductSales,
    ).toBe(100);
    expect(
      after.body.data.estimatedGrossProfit -
        before.body.data.estimatedGrossProfit,
    ).toBe(50);
  });

  it("treats a missing buying cost as unknown rather than zero", async () => {
    const cookie = await adminCookie(`an-mc-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-mcb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };
    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
    });
    await addLine(order.id, { unitPrice: 100, costPrice: null });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(after.body.data.knownCogs - before.body.data.knownCogs).toBe(0);
    expect(
      after.body.data.estimatedGrossProfit -
        before.body.data.estimatedGrossProfit,
    ).toBe(100);
    expect(after.body.data.costDataComplete).toBe(false);
    expect(after.body.data.costCoveragePercent).toBeLessThan(100);
  });

  it("filters by delivery date in Dhaka, not order creation date", async () => {
    const cookie = await adminCookie(`an-d-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-db-${Date.now()}`,
    });

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = new Date();
    const query = { dateFrom: isoDay(from), dateTo: isoDay(to) };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const recent = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 80,
      grandTotal: 80,
    });
    await addLine(recent.id, { unitPrice: 80, costPrice: 30 });
    const old = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 500,
      grandTotal: 500,
      deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    });
    await addLine(old.id, { unitPrice: 500, costPrice: 100 });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(
      after.body.data.netProductSales - before.body.data.netProductSales,
    ).toBe(80);
    expect(after.body.data.totalOrders - before.body.data.totalOrders).toBe(1);
  });

  it("uses Dhaka calendar boundaries for explicit date filters", async () => {
    const cookie = await adminCookie(`an-dh-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-dhb-${Date.now()}`,
    });
    const atDhakaMidnight = new Date("2026-01-02T18:00:00.000Z");
    const justBefore = new Date("2026-01-02T17:59:59.000Z");
    const query = {
      dateFrom: "2026-01-03T00:00:00.000Z",
      dateTo: "2026-01-03T23:59:59.000Z",
    };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const inside = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
      deliveredAt: atDhakaMidnight,
    });
    await addLine(inside.id, { unitPrice: 100 });
    const outside = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 999,
      grandTotal: 999,
      deliveredAt: justBefore,
    });
    await addLine(outside.id, { unitPrice: 999 });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(
      after.body.data.netProductSales - before.body.data.netProductSales,
    ).toBe(100);
    expect(after.body.data.totalOrders - before.body.data.totalOrders).toBe(1);
  });

  it("counts pending payments, low stock and new customers", async () => {
    const cookie = await adminCookie(`an-p-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-pb-${Date.now()}`,
    });

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ lowStockThreshold: 10 })
      .set("Cookie", cookie);
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
      .set("Cookie", cookie);

    expect(
      after.body.data.pendingPaymentsCount -
        before.body.data.pendingPaymentsCount,
    ).toBeGreaterThanOrEqual(1);
    expect(
      after.body.data.lowStockCount - before.body.data.lowStockCount,
    ).toBeGreaterThanOrEqual(1);
    expect(
      after.body.data.newCustomersCount - before.body.data.newCustomersCount,
    ).toBeGreaterThanOrEqual(1);
    expect(after.body.data.generatedAt).toEqual(expect.any(String));
  });

  it("counts pending refunds from the full backlog, not only the selected period", async () => {
    const cookie = await adminCookie(`an-rf-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-rfb-${Date.now()}`,
    });
    const query = { range: "day" };

    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const order = await createTestOrder(tracker, buyer, {
      status: "PENDING",
      grandTotal: 100,
    });
    const payment = await createSslcommerzPayment(tracker, order.id, {
      status: "PENDING",
    });
    await prisma.refund.create({
      data: {
        amount: 25,
        paymentId: payment.id,
        createdAt: new Date("2000-01-01T00:00:00.000Z"),
      },
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(after.body.data.pendingRefundsCount).toBe(
      before.body.data.pendingRefundsCount + 1,
    );
  });

  it("keeps BDT and USD totals separate", async () => {
    const cookie = await adminCookie(`an-cur-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-curb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };

    const bdtBefore = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ ...query, currency: "BDT" })
      .set("Cookie", cookie);
    const usdBefore = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ ...query, currency: "USD" })
      .set("Cookie", cookie);

    const bdt = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
      currency: "BDT",
    });
    await addLine(bdt.id, { unitPrice: 100 });
    const usd = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 200,
      grandTotal: 200,
      currency: "USD",
    });
    await addLine(usd.id, { unitPrice: 200 });

    const bdtAfter = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ ...query, currency: "BDT" })
      .set("Cookie", cookie);
    const usdAfter = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ ...query, currency: "USD" })
      .set("Cookie", cookie);

    expect(
      bdtAfter.body.data.netProductSales - bdtBefore.body.data.netProductSales,
    ).toBe(100);
    expect(
      usdAfter.body.data.netProductSales - usdBefore.body.data.netProductSales,
    ).toBe(200);
  });
});

describe("Analytics returns and cash", () => {
  const approveReturn = async (
    orderId: string,
    orderItemId: string,
    quantity: number,
    opts: {
      restockOrRefund?: "RESTOCK" | "REFUND";
      damaged?: boolean;
      paymentAmount: number;
    },
  ) => {
    const customer = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { customerProfileId: true },
    });
    const customerUser = await prisma.customerProfile.findUniqueOrThrow({
      where: { id: customer.customerProfileId },
      select: { user: { select: { id: true } } },
    });
    void customerUser;
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ret-a-${Date.now()}-${Math.random()}`,
    });

    const payment = await prisma.payment.create({
      data: {
        orderId,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: opts.paymentAmount,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-RET-${Date.now()}-${Math.random()}`,
        paidAt: new Date(),
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await prisma.returnRequest.create({
      data: {
        orderId,
        status: "PENDING",
        items: {
          create: {
            orderItemId,
            quantity,
            restockOrRefund: opts.restockOrRefund ?? "REFUND",
          },
        },
      },
    });
    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${created.id}`)
      .set("Cookie", admin.cookie)
      .send({
        status: "APPROVED",
        ...(opts.damaged !== undefined
          ? {
              items: [
                {
                  orderItemId,
                  restockToStock: !opts.damaged,
                  damaged: opts.damaged,
                },
              ],
            }
          : {}),
      });
    expect(approved.status).toBe(200);
    return { payment, approved };
  };

  it("reverses net sales and resalable cost for a restocked return", async () => {
    const cookie = await adminCookie(`an-r-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-rb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };
    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 200,
      grandTotal: 200,
    });
    const item = await addLine(order.id, {
      quantity: 2,
      unitPrice: 100,
      costPrice: 40,
    });
    await approveReturn(order.id, item.id, 2, {
      restockOrRefund: "RESTOCK",
      paymentAmount: 200,
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(
      after.body.data.netProductSales - before.body.data.netProductSales,
    ).toBe(0);
    expect(after.body.data.knownCogs - before.body.data.knownCogs).toBe(0);
    expect(
      after.body.data.estimatedGrossProfit -
        before.body.data.estimatedGrossProfit,
    ).toBe(0);
    expect(after.body.data.totalOrders - before.body.data.totalOrders).toBe(1);
    expect(after.body.data.cashCollected - before.body.data.cashCollected).toBe(
      200,
    );
  });

  it("does not reverse cost for a damaged return", async () => {
    const cookie = await adminCookie(`an-rd-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-rdb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };
    const before = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
    });
    const item = await addLine(order.id, {
      quantity: 1,
      unitPrice: 100,
      costPrice: 40,
    });
    await approveReturn(order.id, item.id, 1, {
      restockOrRefund: "RESTOCK",
      damaged: true,
      paymentAmount: 100,
    });

    const after = await api()
      .get("/api/v1/admin/analytics/overview")
      .query(query)
      .set("Cookie", cookie);

    expect(
      after.body.data.netProductSales - before.body.data.netProductSales,
    ).toBe(0);
    // Goods were not resalable, so their cost remains in COGS.
    expect(after.body.data.knownCogs - before.body.data.knownCogs).toBe(40);
    expect(
      after.body.data.estimatedGrossProfit -
        before.body.data.estimatedGrossProfit,
    ).toBe(-40);
  });
});

describe("Analytics sales trend and top products", () => {
  it("returns net product sales per Dhaka bucket and net product quantities", async () => {
    const cookie = await adminCookie(`an-s-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-sb-${Date.now()}`,
    });
    const now = new Date();
    const query = {
      dateFrom: isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      dateTo: isoDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    };

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
    });
    await addLine(order.id, {
      sku: "TOP-SKU-1",
      quantity: 1,
      unitPrice: 100,
      costPrice: 40,
    });

    const sales = await api()
      .get("/api/v1/admin/analytics/sales")
      .query({ ...query, groupBy: "day" })
      .set("Cookie", cookie);
    expect(sales.status).toBe(200);
    expect(sales.body.data.currency).toBe("BDT");
    expect(sales.body.data.timezone).toBe("Asia/Dhaka");
    expect(
      sales.body.data.series.reduce(
        (total: number, point: { netProductSales: number }) =>
          total + point.netProductSales,
        0,
      ),
    ).toBe(100);

    const top = await api()
      .get("/api/v1/admin/analytics/top-products")
      .query({ ...query, limit: 10, sortBy: "revenue" })
      .set("Cookie", cookie);
    expect(top.status).toBe(200);
    const product = top.body.data.products.find(
      (row: { sku: string }) => row.sku === "TOP-SKU-1",
    );
    expect(product.netQuantity).toBe(1);
    expect(product.netProductSales).toBe(100);
    expect(product.estimatedGrossProfit).toBe(60);
  });
});

describe("Analytics year granularity", () => {
  it("buckets sales by Dhaka calendar year", async () => {
    const cookie = await adminCookie(`an-y-${Date.now()}`);
    const buyer = await createTestUser(tracker, {
      suffix: `an-yb-${Date.now()}`,
    });
    const query = {
      dateFrom: "2024-01-01T00:00:00.000Z",
      dateTo: "2024-12-30T23:59:59.999Z",
      groupBy: "year" as const,
    };

    const readBucket = async () => {
      const res = await api()
        .get("/api/v1/admin/analytics/sales")
        .query(query)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      return res.body.data.series.find(
        (point: { period: string }) =>
          point.period === "2023-12-31T18:00:00.000Z",
      ) as { netProductSales: number; orders: number } | undefined;
    };

    const before = await readBucket();

    const order = await createTestOrder(tracker, buyer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
      deliveredAt: new Date("2024-03-15T12:00:00.000Z"),
    });
    await addLine(order.id, { sku: "YEAR-SKU-1", quantity: 1, unitPrice: 100 });

    const after = await readBucket();
    expect(after).toBeDefined();
    expect((after?.netProductSales ?? 0) - (before?.netProductSales ?? 0)).toBe(
      100,
    );
    expect((after?.orders ?? 0) - (before?.orders ?? 0)).toBe(1);
  });

  it("accepts a five-year range via range=year", async () => {
    const cookie = await adminCookie(`an-ry-${Date.now()}`);

    const res = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({ range: "year" })
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    const span =
      new Date(res.body.data.dateTo).getTime() -
      new Date(res.body.data.dateFrom).getTime();
    expect(span).toBeGreaterThan(366 * 24 * 60 * 60 * 1000);
  });

  it("keeps the 366-day cap for day buckets and for range=day", async () => {
    const cookie = await adminCookie(`an-cap-${Date.now()}`);

    const explicit = await api()
      .get("/api/v1/admin/analytics/sales")
      .query({
        dateFrom: "2020-01-01T00:00:00.000Z",
        dateTo: "2026-01-02T00:00:00.000Z",
        groupBy: "day",
      })
      .set("Cookie", cookie);
    expect(explicit.status).toBe(400);

    const defaultRange = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({
        range: "day",
        dateFrom: "2020-01-01T00:00:00.000Z",
        dateTo: "2026-01-02T00:00:00.000Z",
      })
      .set("Cookie", cookie);
    expect(defaultRange.status).toBe(400);
  });

  it("rejects a window wider than six years even for year buckets", async () => {
    const cookie = await adminCookie(`an-cap-y-${Date.now()}`);

    const res = await api()
      .get("/api/v1/admin/analytics/sales")
      .query({
        dateFrom: "2015-01-01T00:00:00.000Z",
        dateTo: "2026-01-02T00:00:00.000Z",
        groupBy: "year",
      })
      .set("Cookie", cookie);
    expect(res.status).toBe(400);
  });
});

describe("Analytics validation", () => {
  it("rejects inverted or oversized date ranges", async () => {
    const cookie = await adminCookie(`an-val-${Date.now()}`);

    const inverted = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({
        dateFrom: "2026-06-01T00:00:00.000Z",
        dateTo: "2026-01-01T00:00:00.000Z",
      })
      .set("Cookie", cookie);
    expect(inverted.status).toBe(400);

    const tooWide = await api()
      .get("/api/v1/admin/analytics/overview")
      .query({
        dateFrom: "2020-01-01T00:00:00.000Z",
        dateTo: "2026-01-02T00:00:00.000Z",
      })
      .set("Cookie", cookie);
    expect(tooWide.status).toBe(400);
  });
});

describe("Money allocation", () => {
  it("allocates discounts and tax to lines without losing a cent", () => {
    const lines = allocateLineMoney(
      [
        { unitPrice: 100, quantity: 1 },
        { unitPrice: 33.33, quantity: 1 },
        { unitPrice: 33.33, quantity: 1 },
      ],
      1,
      { pricesIncludeTax: false, taxRatePercent: 5 },
    );
    const discount = lines.reduce((sum, line) => sum + line.discountMinor, 0);
    const tax = lines.reduce((sum, line) => sum + line.taxMinor, 0);
    expect(discount).toBe(100);
    // Discount leaves 165.66 taxable at 5% = 8.283 -> 8.28
    expect(tax).toBe(828);
  });

  it("extracts included tax instead of adding it", () => {
    const [line] = allocateLineMoney([{ unitPrice: 110, quantity: 1 }], 0, {
      pricesIncludeTax: true,
      taxRatePercent: 10,
    });
    expect(line?.taxMinor).toBe(1000);
    expect(line?.netSalesMinor).toBe(10000);
  });
});
