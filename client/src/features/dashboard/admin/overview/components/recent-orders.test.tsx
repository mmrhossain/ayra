import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderListItem } from "@/features/dashboard/admin/orders/types";

import { RecentOrders } from "./recent-orders";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement("a", { href, ...rest }, children),
  };
});

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

const order = (overrides: Partial<OrderListItem> = {}): OrderListItem => ({
  id: "o1",
  orderNumber: "ORD-1",
  status: "DELIVERED",
  grandTotal: 1250,
  createdAt: "2026-10-20T10:00:00.000Z",
  itemCount: 3,
  customerProfile: {
    id: "c1",
    customerCode: "CUS-1",
    user: { email: "a@b.com", name: "Ada" },
  },
  ...overrides,
});

describe("RecentOrders", () => {
  it("renders newest orders with customer, total and status", () => {
    act(() => root.render(<RecentOrders orders={[order()]} />));

    expect(container.textContent).toContain("Ada");
    expect(container.textContent).toContain("ORD-1");
    expect(container.textContent).toContain("3 items");
    expect(container.textContent).toContain("DELIVERED");
    expect(
      container.querySelector('a[href="/admin/orders?search=ORD-1"]'),
    ).not.toBeNull();
  });

  it("shows an empty state when there are no orders", () => {
    act(() => root.render(<RecentOrders orders={[]} />));
    expect(container.textContent).toContain("No orders yet.");
  });
});
