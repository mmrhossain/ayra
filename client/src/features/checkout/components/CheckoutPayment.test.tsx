import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ placeOrder: vi.fn() }));
vi.mock("@/features/checkout/hooks/use-place-order", () => ({
  usePlaceOrder: () => ({
    placeOrder: mocks.placeOrder, placing: false, loading: false,
    priceChange: null, confirmPriceChange: vi.fn(), dismissPriceChange: vi.fn(),
  }),
}));
vi.mock("@/features/settings/public-settings-provider", () => ({
  usePublicSettings: () => ({ payment: { enabledMethods: ["COD", "SSLCOMMERZ"] } }),
}));
import CheckoutPayment from "./CheckoutPayment";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("Checkout review before final action", () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(() => {
    mocks.placeOrder.mockReset();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

  async function render() {
    await act(async () => root.render(createElement(CheckoutPayment, {
      paymentMethod: "COD", onPaymentMethodChange: vi.fn(),
    }, createElement("aside", { "aria-label": "Order summary" }, "Grand Total"))));
  }

  it("renders one review before the submit action in reading order", async () => {
    await render();
    const reviews = container.querySelectorAll('aside[aria-label="Order summary"]');
    const submit = container.querySelector('button[type="submit"]')!;
    expect(reviews).toHaveLength(1);
    expect(reviews[0].compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mocks.placeOrder).not.toHaveBeenCalled();
  });

  it("keeps the existing order submission handler wired exactly once", async () => {
    await render();
    await act(async () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
  });
});
