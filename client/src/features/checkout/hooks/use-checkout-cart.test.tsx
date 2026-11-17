import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetchMyCart: vi.fn() }));
vi.mock("@/features/checkout/api", () => mocks);
import { useCheckoutCart } from "./use-checkout-cart";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
function Consumer() {
  const query = useCheckoutCart();
  return createElement("span", null, query.data?.grandTotal ?? "Loading");
}
describe("checkout request ownership", () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const render = (count: number) => root.render(createElement(QueryClientProvider, { client }, createElement(StrictMode, null,
    Array.from({ length: count }, (_, key) => createElement(Consumer, { key })),
  )));
  beforeEach(() => {
    mocks.fetchMyCart.mockReset().mockResolvedValue({ items: [], grandTotal: 115 });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    container.remove();
  });
  it("shares the checkout page and review read, including later shipping/payment consumers", async () => {
    await act(async () => { render(2); });
    expect(mocks.fetchMyCart).toHaveBeenCalledTimes(1);
    await act(async () => { render(4); });
    expect(mocks.fetchMyCart).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(["checkout-cart"])).toMatchObject({ grandTotal: 115 });
  });
  it("discards totals when checkout unmounts and fetches again on re-entry", async () => {
    await act(async () => { render(1); });
    await act(async () => { root.render(null); });
    await new Promise(done => setTimeout(done, 5));
    expect(client.getQueryData(["checkout-cart"])).toBeUndefined();
    await act(async () => { render(1); });
    expect(mocks.fetchMyCart).toHaveBeenCalledTimes(2);
  });
});
