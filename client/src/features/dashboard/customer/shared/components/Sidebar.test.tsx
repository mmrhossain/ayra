import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/customer/account", signOut: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname, useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({
  default: ({ children, onClick, ...props }: ComponentProps<"a">) => createElement("a", {
    ...props, onClick: event => { event.preventDefault(); onClick?.(event); },
  }, children),
}));
vi.mock("@/lib/api/auth/auth-client", () => ({ authClient: { signOut: mocks.signOut } }));
vi.mock("@/helpers", () => ({ successToast: vi.fn() }));
vi.mock("@/components/shared/change-password-dialog", () => ({
  ChangePasswordDialog: ({ open }: { open: boolean }) => createElement("div", { "data-password-open": String(open) }),
}));
import Sidebar from "./Sidebar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("Compact customer navigation", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    mocks.pathname = "/customer/account";
    mocks.signOut.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  async function render() { await act(async () => root.render(createElement(Sidebar))); }
  const toggle = () => container.querySelector<HTMLButtonElement>('button[aria-label="Toggle account navigation"]')!;

  it("opens on demand and closes after choosing an existing destination", async () => {
    await render();
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    await act(async () => toggle().click());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    const links = [...container.querySelectorAll<HTMLAnchorElement>("nav a")];
    expect(links.map(link => link.getAttribute("href"))).toEqual([
      "/customer/account", "/customer/orders", "/customer/address", "/customer/wish-list",
    ]);
    await act(async () => links[1].click());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("identifies order history on nested order-detail pages", async () => {
    mocks.pathname = "/customer/orders/view-order/example";
    await render();
    expect(toggle().textContent).toContain("Order History");
    expect(container.querySelector('nav a[aria-current="page"]')?.getAttribute("href")).toBe("/customer/orders");
  });

  it("keeps the existing Change Password action available", async () => {
    await render();
    await act(async () => toggle().click());
    const button = [...container.querySelectorAll("button")].find(item => item.textContent?.trim() === "Change Password")!;
    await act(async () => button.click());
    expect(container.querySelector('[data-password-open="true"]')).not.toBeNull();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
