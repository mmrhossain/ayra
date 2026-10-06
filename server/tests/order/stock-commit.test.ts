import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { checkout } from "../../src/modules/order/services/order.service.ts";
import { collectCodPayment } from "../../src/modules/payment/services/payment.service.ts";
import { sslcommerzProvider } from "../../src/modules/payment/providers/sslcommerz.provider.ts";
import { releaseExpiredReservations } from "../../src/modules/catalog/inventory/worker/reservation-expiry.worker.ts";
import {
  CleanupTracker,
  api,
  createActiveCartWithItem,
  createTestProduct,
  createTestUser,
  sslcommerzIpnBody,
  testAddress,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  vi.restoreAllMocks();
  await tracker.cleanup();
});

const mockVerify = (amount: number, tranId: string) => {
  vi.spyOn(sslcommerzProvider, "verifyTransaction").mockResolvedValue({
    valid: true,
    providerReference: tranId,
    transactionId: tranId,
    amount,
    currency: "BDT",
    raw: { status: "VALID", tran_id: tranId, amount: String(amount) },
  });
};

const setupCheckout = async (quantity: number, paymentMethod: "COD" | "SSLCOMMERZ") => {
  const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
  const user = await createTestUser(tracker, { suffix: `sc-${Date.now()}-${Math.random()}` });
  await createActiveCartWithItem(
    tracker,
    user.customerProfileId,
    catalog.variant,
    catalog.product.name,
    quantity
  );

  const order = await checkout(user.customerProfileId, {
    paymentMethod,
    billingAddress: testAddress,
    shippingMethodCode: "STANDARD",
  });
  tracker.orderIds.push(order.id);

  return { catalog, order };
};

describe("Stock commit on payment success", () => {
  it("decrements quantityOnHand and clears reservations on SSLCommerz IPN", async () => {
    const { catalog, order } = await setupCheckout(2, "SSLCOMMERZ");

    const before = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(before.quantityOnHand).toBe(5);
    expect(before.quantityAvailable).toBe(3);
    expect(before.quantityReserved).toBe(2);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id, method: "SSLCOMMERZ" },
    });
    tracker.paymentIds.push(payment.id);

    const tranId = `TRAN-SC-${Date.now()}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerReference: tranId },
    });

    const valId = `VAL-SC-${Date.now()}`;
    const unsigned: Record<string, string> = {
      val_id: valId,
      tran_id: tranId,
      status: "VALID",
      amount: String(Number(order.grandTotal)),
    };
    mockVerify(Number(order.grandTotal), tranId);

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(sslcommerzIpnBody(unsigned));

    expect(res.status).toBe(200);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(3);
    expect(after.quantityReserved).toBe(0);
    expect(after.quantityAvailable).toBe(3);

    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: order.id },
    });
    expect(reservations).toHaveLength(0);

    const stockOut = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: catalog.inventory.id, type: "STOCK_OUT" },
    });
    expect(stockOut).toHaveLength(1);
    expect(stockOut[0]?.quantity).toBe(2);
  });

  it("decrements quantityOnHand on COD payment collection", async () => {
    const { catalog, order } = await setupCheckout(3, "COD");

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id, method: "COD" },
    });
    tracker.paymentIds.push(payment.id);

    await collectCodPayment(payment.id, "test-admin");

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(2);
    expect(after.quantityReserved).toBe(0);
    expect(after.quantityAvailable).toBe(2);

    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: order.id },
    });
    expect(reservations).toHaveLength(0);
  });
});

describe("Reservation expiry worker", () => {
  it("returns expired reservations to available stock and deletes them", async () => {
    const { catalog, order } = await setupCheckout(2, "COD");

    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: order.id },
    });
    expect(reservations).toHaveLength(1);

    await prisma.stockReservation.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const released = await releaseExpiredReservations();
    expect(released).toBeGreaterThanOrEqual(1);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(5);
    expect(after.quantityReserved).toBe(0);
    expect(after.quantityAvailable).toBe(5);

    const remaining = await prisma.stockReservation.findMany({
      where: { orderId: order.id },
    });
    expect(remaining).toHaveLength(0);

    const release = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: catalog.inventory.id, type: "RELEASE" },
    });
    expect(release).toHaveLength(1);

    const cancelled = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.paymentStatus).toBe("FAILED");

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(payment.status).toBe("FAILED");
  });

  it("does not release stock for already-paid orders after TTL", async () => {
    const { catalog, order } = await setupCheckout(2, "SSLCOMMERZ");

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });
    await prisma.stockReservation.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const released = await releaseExpiredReservations();
    expect(released).toBe(0);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityReserved).toBe(2);
    expect(after.quantityAvailable).toBe(3);

    const remaining = await prisma.stockReservation.findMany({
      where: { orderId: order.id },
    });
    expect(remaining).toHaveLength(1);
  });

  it("does not oversell when a late IPN arrives after reservation expiry", async () => {
    const { catalog, order } = await setupCheckout(2, "SSLCOMMERZ");

    await prisma.stockReservation.updateMany({
      where: { orderId: order.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const released = await releaseExpiredReservations();
    expect(released).toBeGreaterThanOrEqual(1);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId: order.id, method: "SSLCOMMERZ" },
    });
    tracker.paymentIds.push(payment.id);

    const tranId = `TRAN-LATE-${Date.now()}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerReference: tranId },
    });

    const valId = `VAL-LATE-OS-${Date.now()}`;
    mockVerify(Number(order.grandTotal), tranId);

    const res = await api()
      .post("/api/v1/payments/sslcommerz/ipn")
      .send(
        sslcommerzIpnBody({
          val_id: valId,
          tran_id: tranId,
          status: "VALID",
          amount: String(Number(order.grandTotal)),
        })
      );

    expect(res.status).toBe(200);

    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(persisted.status).toBe("CANCELLED");
    expect(persisted.paymentStatus).not.toBe("PAID");

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(5);
    expect(after.quantityAvailable).toBe(5);
    expect(after.quantityReserved).toBe(0);
  });
});

describe("Cancel after committed stock", () => {
  it("rejects cancelling a paid order", async () => {
    const { catalog, order } = await setupCheckout(2, "SSLCOMMERZ");
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `paid-cancel-${Date.now()}`,
    });

    await prisma.inventory.update({
      where: { id: catalog.inventory.id },
      data: {
        quantityOnHand: { decrement: 2 },
        quantityReserved: { decrement: 2 },
      },
    });
    await prisma.stockReservation.deleteMany({ where: { orderId: order.id } });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    });

    const before = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(before.quantityOnHand).toBe(3);
    expect(before.quantityReserved).toBe(0);
    expect(before.quantityAvailable).toBe(3);

    const res = await api()
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(/Paid orders cannot be cancelled/i);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(3);
    expect(after.quantityReserved).toBe(0);
    expect(after.quantityAvailable).toBe(3);

    const unchanged = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(unchanged.status).toBe("CONFIRMED");

    const releases = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: catalog.inventory.id, type: "RELEASE" },
    });
    expect(releases).toHaveLength(0);
  });
});
