import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ prefetch, ...props }: { prefetch: boolean }) => <a {...props} data-prefetch={String(prefetch)} /> }));
import IntentLink from "./intent-link";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
it("prefetches only the hovered destination and preserves its click handler", () => {
  const click = vi.fn();
  act(() => root.render(<><IntentLink href="/shop/men/panjabi" onClick={event => { event.preventDefault(); click(); }}>Panjabi</IntentLink><IntentLink href="/shop/women">Women</IntentLink></>));
  const [first, second] = container.querySelectorAll("a");
  expect(first.dataset.prefetch).toBe("false"); expect(second.dataset.prefetch).toBe("false");
  act(() => first.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
  expect(first.dataset.prefetch).toBe("true"); expect(second.dataset.prefetch).toBe("false");
  act(() => first.click()); expect(click).toHaveBeenCalledOnce();
});
it("prefetches on keyboard focus and resets when the destination changes", () => {
  const focus = vi.fn();
  act(() => root.render(<IntentLink href="/shop/men" onFocus={focus}>Shop</IntentLink>));
  act(() => container.querySelector("a")!.focus());
  expect(focus).toHaveBeenCalledOnce(); expect(container.querySelector("a")!.dataset.prefetch).toBe("true");
  act(() => root.render(<IntentLink href="/shop/women">Shop</IntentLink>));
  expect(container.querySelector("a")!.dataset.prefetch).toBe("false");
});
it("does not prefetch external destinations", () => {
  act(() => root.render(<IntentLink href="https://example.com">External</IntentLink>));
  act(() => container.querySelector("a")!.focus());
  expect(container.querySelector("a")!.dataset.prefetch).toBe("false");
});
