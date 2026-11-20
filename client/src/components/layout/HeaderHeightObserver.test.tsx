import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import HeaderHeightObserver from "./HeaderHeightObserver";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("observes only layout headers and avoids rewriting unchanged dimensions", () => {
  let notify = () => {};
  const observe = vi.fn(); const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { notify = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  const container = document.createElement("div");
  container.innerHTML = "<header></header><nav></nav><main><nav></nav></main><div></div>";
  document.body.appendChild(container);
  let height = 48;
  Object.defineProperty(container.querySelector("header"), "offsetHeight", { get: () => height });
  Object.defineProperty(container.querySelector("nav"), "offsetHeight", { get: () => 64 });
  const root = createRoot(container.lastElementChild!);
  const writes = vi.spyOn(document.documentElement.style, "setProperty");
  try {
    act(() => root.render(<HeaderHeightObserver />));
    expect(observe).toHaveBeenCalledTimes(2);
    const initialWrites = writes.mock.calls.length;
    for (let i = 0; i < 20; i++) notify();
    expect(writes).toHaveBeenCalledTimes(initialWrites);
    height = 58; notify();
    expect(writes).toHaveBeenCalledTimes(initialWrites + 1);
    expect(document.documentElement.style.getPropertyValue("--header-height")).toBe("122px");
    act(() => root.unmount());
    expect(disconnect).toHaveBeenCalledOnce();
  } finally {
    writes.mockRestore(); container.remove(); vi.unstubAllGlobals();
    document.documentElement.style.removeProperty("--header-height");
    document.documentElement.style.removeProperty("--navbar-height");
  }
});
