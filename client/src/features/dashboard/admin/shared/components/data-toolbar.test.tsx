import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataToolbar } from "./data-toolbar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

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

function changeInput(value: string) {
  const input = container.querySelector("input") as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("DataToolbar", () => {
  it("does not emit on mount", () => {
    const onValueChange = vi.fn();
    act(() =>
      root.render(
        <DataToolbar
          initialValue="tee"
          searchLabel="Search posts"
          onValueChange={onValueChange}
        />,
      ),
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("emits the trimmed query after the debounce", () => {
    const onValueChange = vi.fn();
    act(() =>
      root.render(
        <DataToolbar
          searchLabel="Search posts"
          placeholder="Search posts"
          onValueChange={onValueChange}
        />,
      ),
    );

    changeInput("  tee  ");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onValueChange).toHaveBeenLastCalledWith("tee");
  });

  it("renders the count, filters, and actions slots", () => {
    act(() =>
      root.render(
        <DataToolbar
          searchLabel="Search"
          onValueChange={() => {}}
          countLabel="12 posts"
          filters={<select aria-label="Status" />}
          actions={<button type="button">Add</button>}
        />,
      ),
    );
    expect(container.textContent).toContain("12 posts");
    expect(container.querySelector('select[aria-label="Status"]')).not.toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Add");
  });
});
