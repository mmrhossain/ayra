import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ cart: vi.fn(), variants: vi.fn(), classes: vi.fn(), coupon: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: { cart: { findFirst: mock.cart }, productVariant: { findMany: mock.variants }, coupon: { findFirst: mock.coupon } }, transaction: vi.fn() }));
vi.mock("../../src/modules/catalog/inventory/services/inventory.service.ts", () => ({ getDefaultWarehouse: vi.fn() }));
vi.mock("../../src/modules/coupon/coupon.service.ts", () => ({ applyCouponAtomic: vi.fn(), calculateCouponPricingForRecord: vi.fn() }));
vi.mock("../../src/modules/tax/tax.service.ts", () => ({ getTaxClasses: mock.classes }));
vi.mock("../../src/modules/settings/settings.service.ts", () => ({ getSettingValue: vi.fn(async (key: string) => key === "checkout.taxEnabled") }));
import { getCart, quoteGuestCart } from "../../src/modules/cart/cart.service.ts";
const tax = { id: "vat", name: "VAT", code: "VAT", rate: 15, isActive: true };
const makeCart = (price: number) => ({
  id: "cart", subtotal: 999, taxAmount: 999, grandTotal: 999, shippingAmount: 999, discountAmount: 999, coupon: null,
  items: [{ id: "line", productId: "product", variantId: "variant", unitPrice: 1, subtotal: 2, quantity: 2, productImage: null,
    variant: { price, product: { categoryId: "category", taxClassId: "vat", images: [] } } }],
});
beforeEach(() => { vi.resetAllMocks(); mock.classes.mockResolvedValue([tax]); });
describe("current cart pricing", () => {
  it("ignores stored totals and recalculates current prices and assigned class on every read", async () => {
    mock.cart.mockResolvedValueOnce(makeCart(100)).mockResolvedValueOnce(makeCart(150));
    expect(await getCart("customer")).toMatchObject({ subtotal: 200, discountAmount: 0, taxAmount: 30, shippingAmount: 0, grandTotal: 230 });
    mock.classes.mockResolvedValue([{ ...tax, rate: 5 }]);
    expect(await getCart("customer")).toMatchObject({ subtotal: 300, taxAmount: 15, shippingAmount: 0, grandTotal: 315 });
    expect(mock.cart).toHaveBeenCalledTimes(2);
    expect(mock.classes).toHaveBeenCalledTimes(2);
  });
  it("quotes guest cart with database prices, aggregates duplicate variants, and excludes unavailable products", async () => {
    mock.variants.mockResolvedValue([{ id: "variant", price: 100, product: { taxClassId: "vat" } }]);
    const result = await quoteGuestCart([{ variantId: "variant", quantity: 1 }, { variantId: "variant", quantity: 2 }, { variantId: "unavailable", quantity: 1 }]);
    expect(result).toMatchObject({ subtotal: 300, taxAmount: 45, shippingAmount: 0, grandTotal: 345 });
    expect(result.items).toEqual([{ variantId: "variant", unitPrice: 100, quantity: 3, subtotal: 300 }]);
    expect(mock.variants).toHaveBeenCalledTimes(1);
  });
  it("returns empty cart without tax reference queries", async () => {
    mock.cart.mockResolvedValue(null);
    expect(await getCart("customer")).toMatchObject({ items: [], grandTotal: 0 });
    expect(mock.classes).not.toHaveBeenCalled();
  });
});
