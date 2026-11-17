import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api/dashboard", () => ({ dashboardApi: mocks, DashboardApiError: class extends Error {} }));
import { customerCartRequest } from "./cart-request";
import { fetchMyCart } from "@/features/checkout/api";
import { fetchAuthCartSnapshot, addAuthCartItem } from "@/features/dashboard/customer/cart/api/cart";
const cart = { items: [], coupon: null, subtotal: 100, discountAmount: 0, taxAmount: 15, shippingAmount: 0, grandTotal: 115 };
beforeEach(() => { vi.resetAllMocks(); customerCartRequest.invalidate(); });
describe("shared cart endpoint", () => {
  it("shares the header and checkout request, then reads fresh data on the next call", async () => {
    mocks.get.mockResolvedValue({ data: cart });
    const [checkout, header] = await Promise.all([fetchMyCart(), fetchAuthCartSnapshot()]);
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(checkout.grandTotal).toBe(115);
    expect(header.grandTotal).toBe(115);
    mocks.get.mockResolvedValue({ data: { ...cart, grandTotal: 230 } });
    expect((await fetchMyCart()).grandTotal).toBe(230);
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
  it("a successful cart mutation invalidates a pending older read", async () => {
    let resolve!: (value: { data: typeof cart }) => void;
    mocks.get.mockReturnValueOnce(new Promise(done => { resolve = done; })).mockResolvedValue({ data: { ...cart, grandTotal: 230 } });
    const old = fetchMyCart();
    mocks.post.mockResolvedValue({ message: "Added" });
    await addAuthCartItem("variant", 1);
    expect((await fetchMyCart()).grandTotal).toBe(230);
    expect(mocks.get).toHaveBeenCalledTimes(2);
    resolve({ data: cart });
    await old;
  });
});
