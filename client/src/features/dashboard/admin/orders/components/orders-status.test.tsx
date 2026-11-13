import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { OrdersByStatusResult } from "@/features/dashboard/admin/overview/api/analytics";

import { OrdersStatusBreakdown } from "./orders-status";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

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

const data: OrdersByStatusResult = {
  currency: "BDT",
  timezone: "Asia/Dhaka",
  dateFrom: "2026-10-01T00:00:00.000Z",
  dateTo: "2026-10-30T23:59:59.999Z",
  breakdown: {
    PENDING: 4,
    CONFIRMED: 2,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  },
};

describe("OrdersStatusBreakdown", () => {
  it("shows each order status as a share of the selected period", () => {
    act(() => root.render(<OrdersStatusBreakdown data={data} />));

    const progress = Array.from(
      container.querySelectorAll<HTMLElement>('[role="progressbar"]'),
    );
    expect(progress).toHaveLength(6);
    expect(progress[0].getAttribute("aria-valuenow")).toBe("67");
    expect(progress[1].getAttribute("aria-valuenow")).toBe("33");
    expect(container.textContent).toContain("6 orders in this period");
  });
});
