import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function Probe({ value }: { value: string }) {
  const debounced = useDebouncedValue(value, 300);
  // Reflect the hook's output into the DOM instead of assigning to a module
  // variable during render (which React's lint rules forbid).
  return <output>{debounced}</output>;
}

function latest() {
  return container.querySelector("output")?.textContent ?? "";
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    act(() => root.render(<Probe value="a" />));
    expect(latest()).toBe("a");
  });

  it("only publishes the last value after the delay", () => {
    act(() => root.render(<Probe value="a" />));
    act(() => root.render(<Probe value="ab" />));
    act(() => root.render(<Probe value="abc" />));
    expect(latest()).toBe("a");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(latest()).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(latest()).toBe("abc");
  });
});
