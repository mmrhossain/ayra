import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  db: { order: { findFirst: vi.fn() }, payment: { findFirst: vi.fn() } },
  tx: { $queryRaw: vi.fn(), payment: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() }, paymentEvent: { create: vi.fn() } },
  transaction: vi.fn(), initiate: vi.fn(),
}));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: mocks.db, transaction: (callback: unknown) => mocks.transaction(callback) }));
vi.mock("../../src/modules/payment/providers/index.ts", () => ({ getPaymentProvider: () => ({ initiate: mocks.initiate }) }));
vi.mock("../../src/modules/payment/services/sslcommerz-config.service.ts", () => ({ getSslcommerzCallbackUrls: async () => ({ successUrl: "/success", failUrl: "/failed", cancelUrl: "/cancelled", ipnUrl: "/ipn" }) }));
vi.mock("../../src/modules/settings/settings.service.ts", () => ({ getSettingValue: async () => ["COD", "SSLCOMMERZ"] }));
vi.mock("../../src/modules/catalog/inventory/services/inventory.service.ts", () => ({ commitOrderStock: vi.fn() }));
vi.mock("../../src/modules/notification/services/notification.service.ts", () => ({ enqueuePaymentConfirmation: vi.fn(), notifyOrderStatusChange: vi.fn() }));
import { initiatePayment } from "../../src/modules/payment/services/payment.service.ts";
import { initiatePaymentSchema } from "../../src/modules/payment/validators/payment.validators.ts";
const order = { id: "order-1", orderNumber: "AYR-261120-011", grandTotal: 100, currency: "BDT", status: "PENDING", paymentStatus: "PENDING", addresses: [], customerProfile: { user: { name: "Customer", email: "customer@example.com" } } };
const oldPayment = { id: "old-attempt", paymentNumber: "PAY-001", method: "SSLCOMMERZ", status: "INITIATED", amount: 100, currency: "BDT", createdAt: new Date(), checkoutUrl: "https://sandbox.example/old-session" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.order.findFirst.mockResolvedValue(order);
  mocks.db.payment.findFirst.mockResolvedValue(oldPayment);
  mocks.tx.$queryRaw.mockResolvedValue([{ id: order.id, status: "PENDING", paymentStatus: "PENDING" }]);
  mocks.tx.payment.findFirst.mockResolvedValue(null);
  mocks.tx.payment.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.payment.create.mockImplementation(async ({ data }) => ({ ...oldPayment, id: "new-attempt", ...data }));
  mocks.transaction.mockImplementation(async callback => callback(mocks.tx));
  mocks.initiate.mockImplementation(async providerOrder => ({ checkoutUrl: "https://sandbox.example/new-session", paymentStatus: "INITIATED", providerReference: providerOrder.orderNumber, expiresAt: new Date(Date.now() + 1800000) }));
});
describe("authenticated payment retries", () => {
  it("keeps normal initiation idempotent", async () => {
    const result = await initiatePayment("owner", order.id, "SSLCOMMERZ");
    expect(result.checkoutUrl).toBe(oldPayment.checkoutUrl); expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("requests a fresh session and retires only the old attempt URL", async () => {
    const result = await initiatePayment("owner", order.id, "SSLCOMMERZ", true);
    expect(result.checkoutUrl).toBe("https://sandbox.example/new-session");
    expect(mocks.initiate.mock.calls[0][0].orderNumber).toMatch(/^AYR-261120-011-[A-F0-9]{10}$/);
    expect(mocks.tx.payment.updateMany).toHaveBeenCalledWith({ where: { id: "old-attempt", status: { in: ["PENDING", "INITIATED"] } }, data: { expiresAt: expect.any(Date) } });
    expect(mocks.tx.payment.create).toHaveBeenCalledOnce();
    expect(mocks.db.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: order.id, customerProfileId: "owner", deletedAt: null } }));
  });
  it("reuses a new session created concurrently instead of expiring it", async () => {
    mocks.tx.payment.findFirst.mockResolvedValue({ ...oldPayment, id: "concurrent-attempt", checkoutUrl: "https://sandbox.example/concurrent-session" });
    const result = await initiatePayment("owner", order.id, "SSLCOMMERZ", true);
    expect(result.checkoutUrl).toBe("https://sandbox.example/concurrent-session"); expect(mocks.tx.payment.create).not.toHaveBeenCalled();
    expect(mocks.tx.payment.updateMany.mock.calls[0][0].where.id).toBe("old-attempt");
  });
  it("does not retire the existing attempt if gateway initiation fails", async () => {
    mocks.initiate.mockRejectedValue(new Error("Gateway unavailable"));
    await expect(initiatePayment("owner", order.id, "SSLCOMMERZ", true)).rejects.toThrow("Gateway unavailable");
    expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.tx.payment.updateMany).not.toHaveBeenCalled();
  });
  it("does not change COD retry behavior", async () => {
    mocks.db.payment.findFirst.mockResolvedValue({ ...oldPayment, method: "COD" });
    expect((await initiatePayment("owner", order.id, "COD", true)).checkoutUrl).toBe(oldPayment.checkoutUrl);
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("blocks retries for another customer's order", async () => {
    mocks.db.order.findFirst.mockResolvedValue(null);
    await expect(initiatePayment("other-owner", order.id, "SSLCOMMERZ", true)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.initiate).not.toHaveBeenCalled();
  });
  it("blocks a retry if the order becomes paid before the transaction lock", async () => {
    mocks.tx.$queryRaw.mockResolvedValue([{ id: order.id, status: "CONFIRMED", paymentStatus: "PAID" }]);
    await expect(initiatePayment("owner", order.id, "SSLCOMMERZ", true)).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.tx.payment.updateMany).not.toHaveBeenCalled(); expect(mocks.tx.payment.create).not.toHaveBeenCalled();
  });
  it("defaults retry off for existing clients and accepts only boolean flags", () => {
    expect(initiatePaymentSchema.parse({ method: "SSLCOMMERZ" }).retry).toBe(false);
    expect(initiatePaymentSchema.parse({ method: "SSLCOMMERZ", retry: true }).retry).toBe(true);
    expect(initiatePaymentSchema.safeParse({ method: "SSLCOMMERZ", retry: "true" }).success).toBe(false);
  });
});
