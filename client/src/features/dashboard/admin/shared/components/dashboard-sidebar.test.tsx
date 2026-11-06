import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardSidebar } from "./dashboard-sidebar";

const mocks = vi.hoisted(() => ({
  pathname: "/admin/products",
  setOpenMobile: vi.fn(),
  setOpen: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      onClick,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    }) =>
      React.createElement(
        "a",
        {
          href,
          onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            onClick?.(event);
          },
          ...props,
        },
        children,
      ),
  };
});

vi.mock("@/components/ui/sidebar", async () => {
  const React = await import("react");
  const Box = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children);

  return {
    Sidebar: Box,
    SidebarContent: Box,
    SidebarGroup: Box,
    SidebarGroupContent: Box,
    SidebarGroupLabel: Box,
    SidebarHeader: Box,
    SidebarMenu: Box,
    SidebarMenuItem: Box,
    SidebarMenuButton: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    useSidebar: () => ({
      setOpenMobile: mocks.setOpenMobile,
      setOpen: mocks.setOpen,
    }),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("admin sidebar navigation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.setOpenMobile.mockClear();
    mocks.setOpen.mockClear();

    await act(async () => {
      root.render(
        <DashboardSidebar
          access={{ role: "ADMIN", isSuperAdmin: true, adminPermissions: [] }}
          homeHref="/admin"
        />,
      );
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function clickLink(href: string) {
    const link = container.querySelector<HTMLAnchorElement>(
      `a[href="${href}"]`,
    );
    expect(link).not.toBeNull();

    await act(async () => {
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
  }

  it("exposes the active destination with aria-current", () => {
    const active = container.querySelector<HTMLAnchorElement>(
      'a[href="/admin/products"]',
    );
    const inactive = container.querySelector<HTMLAnchorElement>(
      'a[href="/admin/orders"]',
    );

    expect(active?.getAttribute("aria-current")).toBe("page");
    expect(inactive?.getAttribute("aria-current")).toBeNull();
  });

  it("closes the mobile drawer after selecting the active destination", async () => {
    await clickLink("/admin/products");

    expect(mocks.setOpenMobile).toHaveBeenCalledWith(false);
    expect(mocks.setOpen).not.toHaveBeenCalled();
  });

  it("closes the mobile drawer after selecting another destination", async () => {
    await clickLink("/admin/orders");

    expect(mocks.setOpenMobile).toHaveBeenCalledWith(false);
    expect(mocks.setOpen).not.toHaveBeenCalled();
  });
});
