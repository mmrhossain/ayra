import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ pathname: "/shop" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/dynamic", () => ({
  default: () => function Menu({ onSelect }: { onSelect: (name: string) => void }) {
    return <div data-category-menu><button onClick={() => onSelect("Women")}>Women</button></div>;
  },
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/shared/SearchBox", () => ({ default: () => null }));
vi.mock("@/components/shared/user-avatar", () => ({ UserAvatar: () => null }));
vi.mock("@/components/layout/NavbarCountBadge", () => ({ NavbarCountBadge: () => null }));
vi.mock("@/hooks/useStorefrontCounts", () => ({
  useStorefrontCountBadge: () => ({ loading: false, count: 0 }),
}));
vi.mock("@/features/settings/public-settings-provider", () => ({
  usePublicSettings: () => ({ store: { name: "Ayra", logoUrl: "" } }),
}));
vi.mock("@/helpers", () => ({ successToast: vi.fn() }));
vi.mock("@/lib/api/auth/auth-client", () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }), signOut: vi.fn() },
}));
import DesktopNavbar from "./DesktopNavbar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
const render = () => act(() => root.render(<DesktopNavbar categories={[]} initialIsCustomer={false} />));
const menu = () => container.querySelector("[data-category-menu]");
const enter = () => act(() => container.querySelector('[class*="group/cat"]')!
  .dispatchEvent(new MouseEvent("pointerover", { bubbles: true })));

beforeEach(() => {
  route.pathname = "/shop";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  render();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
describe("category mega menu dismissal", () => {
  it("closes after selection, including when the current route stays the same", () => {
    enter();
    expect(menu()).not.toBeNull();
    act(() => (menu()!.querySelector("button") as HTMLButtonElement).click());
    expect(menu()).toBeNull();
    expect(container.textContent).toContain("Women");
    enter();
    expect(menu()).not.toBeNull();
  });
  it("closes on navigation and stays closed when returning with back navigation", () => {
    enter();
    route.pathname = "/shop/women";
    render();
    expect(menu()).toBeNull();
    route.pathname = "/shop";
    render();
    expect(menu()).toBeNull();
    enter();
    expect(menu()).not.toBeNull();
  });
  it("can reopen with keyboard focus after navigation", () => {
    enter();
    route.pathname = "/about";
    render();
    act(() => (container.querySelector('[class*="group/cat"] button') as HTMLButtonElement).focus());
    expect(menu()).not.toBeNull();
  });
});
