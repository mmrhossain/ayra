import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OVERVIEW_FIXTURE } from "@/features/dashboard/admin/overview/utils/fixtures";

import { DetailedMetrics } from "./detailed-metrics";

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

describe("DetailedMetrics", () => {
  it("is collapsed by default and lists all remaining metrics", () => {
    act(() => root.render(<DetailedMetrics data={OVERVIEW_FIXTURE} />));
    const details = container.querySelector("details")!;
    expect(details.hasAttribute("open")).toBe(false);
    expect(details.querySelector("summary")?.textContent).toContain(
      "Detailed accounting metrics",
    );

    for (const label of [
      "Gross product sales",
      "Product discounts",
      "Sales reversed by returns",
      "Tax",
      "Net sales per delivered order",
      "Estimated gross margin",
      "Known COGS",
      "Net shipping income",
      "Shipping expense",
      "Net shipping result",
      "Cash collected",
      "Cash refunded",
      "Net cash movement",
    ]) {
      expect(details.textContent).toContain(label);
    }
    expect(details.textContent).not.toContain("Pending payments");
    expect(details.textContent).not.toContain("Low stock");
    expect(details.textContent).not.toContain("New customers");
  });

  it("groups the metrics under four headings", () => {
    act(() => root.render(<DetailedMetrics data={OVERVIEW_FIXTURE} />));
    for (const heading of [
      "Revenue",
      "Cost & profit",
      "Shipping",
      "Operations & cash",
    ]) {
      expect(container.textContent).toContain(heading);
    }

    const costGroup = Array.from(container.querySelectorAll("h3")).find(
      (heading) => heading.textContent === "Cost & profit",
    );
    expect(costGroup?.nextElementSibling?.className).toContain("sm:grid-cols-2");
    expect(costGroup?.nextElementSibling?.className).not.toContain(
      "xl:grid-cols-3",
    );
  });
});
