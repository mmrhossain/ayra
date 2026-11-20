import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { fetchAvailableCartCoupons } from "@/features/cart/api";
import { useCartStore } from "@/stores/useCartStore";
import Subtotal from "./Subtotal";

vi.mock("@/features/cart/api", () => ({ fetchAvailableCartCoupons: vi.fn() }));
vi.mock("@/features/settings/public-settings-provider", () => ({
  usePublicSettings: () => ({ checkout: { taxEnabled: false } }),
}));
vi.mock("@/lib/api/auth/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "customer-1" } } }) },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/helpers", () => ({
  formatPrice: (amount: number) => `Tk ${amount}`,
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

it("loads coupons on entry, applies the clicked card, and removes it with its cross button", async () => {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const previousCart = useCartStore.getState();
  const applyCoupon = vi.fn(async (couponCode: string) => {
    useCartStore.setState({ couponCode, discountAmount: 49.5 });
    return { message: "Coupon applied" };
  });
  const removeCoupon = vi.fn(async () => {
    useCartStore.setState({ couponCode: null, discountAmount: 0 });
    return { message: "Coupon removed" };
  });
  useCartStore.setState({
    cart: [{ id: "item", variantId: "variant", quantity: 1, unitPrice: 500, subtotal: 500, productName: "Shirt" }],
    totalAmount: 500,
    applyCoupon,
    removeCoupon,
  });
  vi.mocked(fetchAvailableCartCoupons).mockResolvedValue([
    { code: "OFFER", name: "Cart offer", discountType: "FIXED_AMOUNT", discountAmount: 49.5 },
  ]);
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
  });
  client.setQueryData(
    ["available-cart-coupons", "customer-1", [["variant", 1, 500]]],
    [],
    { updatedAt: Date.now() - 30_000 },
  );
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const applyCard = () => container.querySelector<HTMLButtonElement>('button[aria-label="Apply coupon Cart offer"]');
  const removeButton = () => container.querySelector<HTMLButtonElement>('button[aria-label="Remove coupon Cart offer"]');

  try {
    await act(async () => {
      root.render(<QueryClientProvider client={client}><Subtotal /></QueryClientProvider>);
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(applyCard()).not.toBeNull();
    });
    expect(fetchAvailableCartCoupons).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input[aria-label="Promo code"]')).toBeNull();
    expect(container.textContent).toContain("Save Tk 49.50");
    await act(async () => applyCard()?.click());
    expect(applyCoupon).toHaveBeenCalledWith("OFFER");
    expect(container.textContent).toContain("Applied");
    expect(removeButton()).not.toBeNull();
    await act(async () => removeButton()?.click());
    expect(removeCoupon).toHaveBeenCalledTimes(1);
    expect(applyCard()).not.toBeNull();
    expect(removeButton()).toBeNull();
  } finally {
    await act(async () => root.unmount());
    client.clear();
    container.remove();
    useCartStore.setState(previousCart);
    if (previousEnvironment === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previousEnvironment;
  }
});
