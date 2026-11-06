import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

import Newsletter from "./Newsletter";

let container: HTMLDivElement;
let root: Root;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  toast.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Newsletter", () => {
  it("rejects an invalid email without calling the toast", () => {
    act(() => root.render(<Newsletter />));
    const form = container.querySelector("form")!;
    const input = container.querySelector("input")!;

    act(() => setInputValue(input, "not-an-email"));
    act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(container.textContent).toContain("Enter a valid email address.");
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not claim a successful subscription", async () => {
    act(() => root.render(<Newsletter />));
    const form = container.querySelector("form")!;
    const input = container.querySelector("input")!;

    act(() => setInputValue(input, "shopper@example.com"));
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(toast).toHaveBeenCalledWith(
      "Newsletter signup isn't available yet. Please check back soon.",
    );
    expect(container.querySelector("[role=alert]")?.textContent).toBe("");
  });
});
