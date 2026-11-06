import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StatusBadge, type StatusBadgeVariant } from "./status-badge";

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

const cases: Array<[StatusBadgeVariant, string]> = [
  ["success", "text-emerald-700"],
  ["warning", "text-amber-800"],
  ["danger", "text-destructive"],
  ["info", "text-sky-700"],
  ["neutral", "bg-secondary"],
];

describe("StatusBadge", () => {
  it.each(cases)("renders the %s variant", (variant, expected) => {
    act(() => root.render(<StatusBadge variant={variant}>Status</StatusBadge>));
    const badge = container.querySelector("[data-slot=status-badge]")!;
    expect(badge.className).toContain(expected);
    expect(badge.textContent).toBe("Status");
  });

  it("defaults to neutral", () => {
    act(() => root.render(<StatusBadge>Unknown</StatusBadge>));
    expect(container.querySelector("[data-slot=status-badge]")!.className).toContain(
      "bg-secondary",
    );
  });
});
