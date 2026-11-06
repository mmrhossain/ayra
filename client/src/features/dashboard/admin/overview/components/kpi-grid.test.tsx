import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OVERVIEW_FIXTURE } from "@/features/dashboard/admin/overview/utils/fixtures";

import { KpiGrid } from "./kpi-grid";

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

describe("KpiGrid", () => {
  it("renders exactly four headline KPIs", () => {
    act(() => root.render(<KpiGrid data={OVERVIEW_FIXTURE} previous={null} />));
    expect(container.querySelectorAll("[data-slot=kpi-card]")).toHaveLength(4);
    for (const label of [
      "Net product sales",
      "Estimated gross profit",
      "Delivered orders",
      "Outstanding COD",
    ]) {
      expect(container.textContent).toContain(label);
    }
    expect(container.textContent).toMatch(/01\/10\/2026/);
    expect(container.textContent).toMatch(/30\/10\/2026/);
  });

  it("shows no-prior-data when there is no previous window", () => {
    act(() => root.render(<KpiGrid data={OVERVIEW_FIXTURE} previous={null} />));
    expect(container.textContent).toContain("No prior data");
  });

  it("shows signed deltas when a previous window exists", () => {
    act(() =>
      root.render(
        <KpiGrid
          data={OVERVIEW_FIXTURE}
          previous={{
            ...OVERVIEW_FIXTURE,
            netProductSales: 800,
            estimatedGrossProfit: 320,
            totalOrders: 10,
            outstandingCod: 300,
          }}
        />,
      ),
    );
    const cardFor = (label: string) =>
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-slot=kpi-card]"),
      ).find((card) => card.textContent?.includes(label))!;

    expect(cardFor("Net product sales").textContent).toContain("+15.0%");
    expect(cardFor("Estimated gross profit").textContent).toContain("0.0%");
    expect(cardFor("Delivered orders").textContent).toContain("+20.0%");
    expect(cardFor("Outstanding COD").textContent).toContain("-50.0%");
  });
});
