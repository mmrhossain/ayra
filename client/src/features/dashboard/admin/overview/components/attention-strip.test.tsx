import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OVERVIEW_FIXTURE } from "@/features/dashboard/admin/overview/utils/fixtures";

import { AttentionStrip } from "./attention-strip";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
    }: {
      href: string;
      children: React.ReactNode;
    }) => React.createElement("a", { href }, children),
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

const FULL = {
  role: "ADMIN",
  isSuperAdmin: true,
  adminPermissions: [],
  adminActions: [],
  staffStatus: "ACTIVE",
};

describe("AttentionStrip", () => {
  it("links only actionable queues for a full-access admin", () => {
    act(() =>
      root.render(<AttentionStrip data={OVERVIEW_FIXTURE} access={FULL} />),
    );
    expect(
      Array.from(container.querySelectorAll("a")).map((anchor) =>
        anchor.getAttribute("href"),
      ),
    ).toEqual([
      "/admin/refunds",
      "/admin/inventory",
      "/admin/payments",
    ]);
    expect(container.querySelector('[role="group"]')?.className).toContain(
      "sm:grid-cols-2",
    );
  });

  it("shows all clear when every visible queue has zero items", () => {
    act(() =>
      root.render(
        <AttentionStrip
          data={{
            ...OVERVIEW_FIXTURE,
            pendingRefundsCount: 0,
            lowStockCount: 0,
            pendingPaymentsCount: 0,
          }}
          access={FULL}
        />,
      ),
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).toContain("All clear");
  });

  it("hides links the access cannot open", () => {
    act(() =>
      root.render(
        <AttentionStrip
          data={OVERVIEW_FIXTURE}
          access={{ ...FULL, isSuperAdmin: false, adminPermissions: [] }}
        />,
      ),
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).not.toContain("All clear");
  });
});
