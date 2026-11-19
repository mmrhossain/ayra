import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));
vi.mock("next/dynamic", () => ({ default: () => () => <span data-widget /> }));
import StorefrontDeferredWidgets from "./StorefrontDeferredWidgets";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  route.path = "/";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});
describe("deferred storefront widgets", () => {
  it("defers widgets until after load and idle, with a timer fallback", () => {
    act(() => root.render(<StorefrontDeferredWidgets />));
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(0);
    act(() => { window.dispatchEvent(new Event("load")); vi.advanceTimersByTime(1999); });
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(0);
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(2);
  });
  it("allows interaction to load widgets immediately and cleans up the timer", () => {
    act(() => root.render(<StorefrontDeferredWidgets />));
    act(() => window.dispatchEvent(new Event("keydown")));
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(2);
    act(() => vi.runAllTimers());
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(2);
  });
  it("does not mount widgets on checkout or cart, including after navigation", () => {
    route.path = "/checkout";
    act(() => root.render(<StorefrontDeferredWidgets />));
    act(() => { window.dispatchEvent(new Event("scroll")); vi.runAllTimers(); });
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(0);
    route.path = "/shop";
    act(() => root.render(<StorefrontDeferredWidgets />));
    act(() => window.dispatchEvent(new Event("keydown")));
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(2);
    route.path = "/cart";
    act(() => root.render(<StorefrontDeferredWidgets />));
    expect(container.querySelectorAll("[data-widget]")).toHaveLength(0);
  });
});
