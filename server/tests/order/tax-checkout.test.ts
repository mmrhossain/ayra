import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  taxEnabled: true,
  cart: vi.fn(), taxClasses: vi.fn(), create: vi.fn(), shipping: vi.fn(),
  tx: { $queryRaw: vi.fn(), inventoryTransaction: { createMany: vi.fn() }, stockReservation: { createMany: vi.fn() }, cart: { update: vi.fn(), findUniqueOrThrow: vi.fn() }, taxClass: { findMany: vi.fn() }, order: { create: vi.fn() } },
}));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: {}, transaction: async (fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx) }));
vi.mock("../../src/modules/settings/settings.service.ts", () => ({ getSettingValue: async (key: string) => key === "payment.enabledMethods" ? ["COD"] : key === "checkout.taxEnabled" && mocks.taxEnabled }));
vi.mock("../../src/modules/shipping/services/shipping.service.ts", () => ({ quoteShipping: mocks.shipping }));
vi.mock("../../src/modules/coupon/coupon.service.ts", () => ({ applyCouponAtomic: vi.fn() }));
vi.mock("../../src/modules/notification/services/notification.service.ts", () => ({ enqueueOrderConfirmation: vi.fn(), notifyNewOrder: vi.fn() }));
vi.mock("../../src/modules/catalog/inventory/services/inventory.service.ts", () => ({ dispatchLowStockAlerts: vi.fn() }));
vi.mock("../../src/modules/geography/utils/address-geo.ts", () => ({ assertAddressGeoHierarchy: vi.fn() }));
vi.mock("../../src/modules/order/services/order-stock.service.ts", () => ({ reserveCheckoutStock: async () => ({ reservations: [], inventoryTransactionsData: [], lowStockAlerts: [] }) }));
vi.mock("../../src/modules/order/utils/order-helpers.ts", async importOriginal => ({
  ...await importOriginal<typeof import("../../src/modules/order/utils/order-helpers.ts")>(),
  generateOrderNumber: async () => "ORD-TAX-TEST", saveCheckoutAddressIfNew: vi.fn(),
}));
import { checkout } from "../../src/modules/order/services/order-checkout.service.ts";
const address = { fullName: "Buyer", phone: "01700000000", country: "Bangladesh", division: "Dhaka", district: "Dhaka", addressLine1: "Test road" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.taxEnabled = true;
  mocks.tx.$queryRaw.mockResolvedValue([{ id: "cart" }]);
  mocks.tx.cart.findUniqueOrThrow.mockResolvedValue({
    id: "cart", subtotal: 999, grandTotal: 999, taxAmount: 999, coupon: null, customerProfile: null,
    items: [{ variantId: "variant", productId: "product", quantity: 2, sku: "SKU", unitPrice: 1,
      variant: { price: 100, costPrice: null, sku: "SKU", deletedAt: null, attributes: [], product: { name: "Product", status: "ACTIVE", deletedAt: null, categoryId: "category", taxClassId: "vat" } } }],
  });
  mocks.tx.taxClass.findMany.mockResolvedValue([{ id: "vat", name: "Fresh VAT", code: "VAT", rate: 15, isActive: true }]);
  mocks.shipping.mockResolvedValue({ shippingAmount: 60, methodName: "Standard", methodCode: "STANDARD", price: 60 });
  mocks.tx.order.create.mockImplementation(async ({ data }) => ({ ...data, id: "order", currency: "BDT", items: data.items.create }));
});
describe("checkout tax snapshots", () => {
  it("the single switch disables VAT without changing shipping", async () => {
    mocks.taxEnabled = false;
    const result = await checkout("customer", { billingAddress: address, paymentMethod: "COD", shippingMethodCode: "STANDARD" });
    expect(result).toMatchObject({ subtotal: 200, taxAmount: 0, shippingAmount: 60, grandTotal: 260, pricesIncludeTax: false });
    expect(result.items[0]).toMatchObject({ taxRate: 0, taxAmount: 0 });
  });
  it("recalculates from current data and persists reconciled order and item snapshots", async () => {
    const result = await checkout("customer", { billingAddress: address, paymentMethod: "COD", shippingMethodCode: "STANDARD" });
    expect(result).toMatchObject({ subtotal: 200, discountAmount: 0, taxAmount: 30, shippingAmount: 60, grandTotal: 290, pricesIncludeTax: false });
    expect(result.items[0]).toMatchObject({ taxClassName: "Fresh VAT", taxRate: 15, taxAmount: 30, allocationVersion: 1 });
    expect(mocks.tx.taxClass.findMany).toHaveBeenCalledWith({ where: { id: { in: ["vat"] } } });
    expect(mocks.shipping).toHaveBeenCalledWith(address, "STANDARD", 200, mocks.tx);
    expect(mocks.tx.order.create.mock.calls[0]![0].data.payments.create.amount).toBe(290);
    mocks.tx.taxClass.findMany.mockResolvedValue([{ id: "vat", name: "Changed VAT", rate: 5, isActive: true }]);
    expect(result.items[0]).toMatchObject({ taxClassName: "Fresh VAT", taxRate: 15, taxAmount: 30 });
  });
});
