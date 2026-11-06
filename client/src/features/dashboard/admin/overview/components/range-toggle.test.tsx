import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RangeSwitch } from "./range-toggle";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("RangeSwitch", () => {
  it("marks the active range with aria-pressed", () => {
    act(() => root.render(<RangeSwitch value="month" onChange={() => {}} />));
    const pressed = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    )
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => button.textContent);
    expect(pressed).toEqual(["Month"]);
  });

  it("reports the clicked range", () => {
    const onChange = vi.fn();
    act(() => root.render(<RangeSwitch value="day" onChange={onChange} />));
    const year = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Year")!;
    act(() => {
      year.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("year");
  });

  it("disables interaction while a refetch is in-flight", () => {
    act(() =>
      root.render(<RangeSwitch value="day" onChange={() => {}} disabled />),
    );
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    );
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });
});
