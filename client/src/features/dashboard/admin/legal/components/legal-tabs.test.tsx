import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LegalTabs } from "./legal-tabs";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams("tab=terms"),
  pathname: "/admin/legal",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.params,
}));

vi.mock("@/features/dashboard/admin/legal/components/legal-table", async () => {
  const React = await import("react");
  return {
    LegalTable: ({ type }: { type: string }) =>
      React.createElement("p", null, `type:${type}`),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const initialData = {
  items: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.params = new URLSearchParams("tab=terms");
  mocks.replace.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("LegalTabs", () => {
  it("renders All, Privacy Policy, Terms of Service", () => {
    act(() => root.render(<LegalTabs initialData={initialData as never} />));
    expect(
      Array.from(container.querySelectorAll('[role="tab"]')).map(
        (tab) => tab.textContent,
      ),
    ).toEqual(["All", "Privacy Policy", "Terms of Service"]);
  });

  it("maps the tab to a document type", () => {
    act(() => root.render(<LegalTabs initialData={initialData as never} />));
    expect(container.textContent).toContain("type:TERMS");
  });

  it("writes ?tab= and keeps the URL clean for All", () => {
    act(() => root.render(<LegalTabs initialData={initialData as never} />));
    const allTab = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "All")!;
    act(() => {
      allTab.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 }),
      );
    });
    expect(mocks.replace).toHaveBeenCalledWith("/admin/legal", {
      scroll: false,
    });
  });
});
