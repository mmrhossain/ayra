import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SalesTrend } from "@/features/dashboard/admin/overview/api/analytics";

import { SalesChart } from "./sales-chart";

const mocks = vi.hoisted(() => ({
  fetchSales: vi.fn(),
}));

vi.mock("@/features/dashboard/admin/overview/api/analytics", async (orig) => {
  const actual =
    await orig<
      typeof import("@/features/dashboard/admin/overview/api/analytics")
    >();
  return { ...actual, fetchSales: mocks.fetchSales };
});

vi.mock("recharts", () => {
  const passthrough = (name: string) => {
    const Comp = ({ children }: { children?: React.ReactNode }) => (
      <div data-recharts={name}>{children}</div>
    );
    Comp.displayName = `Mock${name}`;
    return Comp;
  };
  return {
    Area: passthrough("Area"),
    AreaChart: passthrough("AreaChart"),
    CartesianGrid: passthrough("CartesianGrid"),
    ReferenceLine: passthrough("ReferenceLine"),
    XAxis: passthrough("XAxis"),
    YAxis: passthrough("YAxis"),
    Tooltip: passthrough("Tooltip"),
    Legend: passthrough("Legend"),
    ResponsiveContainer: passthrough("ResponsiveContainer"),
  };
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const trend = (groupBy: string, netProductSales: number): SalesTrend => ({
  currency: "BDT",
  timezone: "Asia/Dhaka",
  groupBy,
  dateFrom: "2026-10-01T00:00:00.000Z",
  dateTo: "2026-10-30T23:59:59.999Z",
  series: [
    {
      period: "2026-10-01T00:00:00.000Z",
      grossProductSales: netProductSales,
      productDiscounts: 0,
      taxAmount: 0,
      salesReversed: 0,
      netProductSales,
      orders: 2,
    },
  ],
});

let container: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  act(() =>
    root.render(
      <QueryClientProvider client={client}>{node}</QueryClientProvider>,
    ),
  );
}

beforeEach(() => {
  mocks.fetchSales.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("SalesChart", () => {
  it("renders the server-provided data and the range switch", () => {
    render(<SalesChart initialData={trend("day", 920)} initialRange="day" />);
    expect(container.textContent).toContain("Sales trend");
    const pressedRanges = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
    ).filter((button) => button.getAttribute("aria-pressed") === "true");
    expect(pressedRanges.map((button) => button.textContent)).toContain("Day");
    expect(container.textContent).toContain("Net sales");
    expect(container.textContent).toContain("Avg / order");
  });

  it("toggles a series off and shows the table fallback", () => {
    render(<SalesChart initialData={trend("day", 920)} initialRange="day" />);

    const ordersToggle = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
    ).find((button) => button.textContent?.includes("Orders"))!;
    act(() => {
      ordersToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(ordersToggle.getAttribute("aria-pressed")).toBe("false");

    const tableToggle = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Table")!;
    act(() => {
      tableToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.textContent).toContain("Period");
  });

  it("refetches with the selected range on click", async () => {
    mocks.fetchSales.mockResolvedValue(trend("year", 5000));
    render(<SalesChart initialData={trend("day", 920)} initialRange="day" />);

    const year = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent === "Year")!;

    await act(async () => {
      year.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mocks.fetchSales).toHaveBeenCalledWith({
      range: "year",
      groupBy: "year",
    });
  });
});
