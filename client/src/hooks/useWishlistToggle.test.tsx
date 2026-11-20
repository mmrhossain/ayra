import { act, Profiler } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const owner = vi.hoisted(() => ({ ready: true }));
vi.mock("@/hooks/useStorefrontCounts", () => ({ useStorefrontOwner: () => ({ ownerReady: owner.ready }) }));
vi.mock("@/lib/api/auth/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "customer", role: "CUSTOMER" } } }) },
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/shop", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/helpers/index", () => ({ errorToast: vi.fn(), successToast: vi.fn() }));
import { useWishStore } from "@/stores/useWishStore";
import type { WishlistItem } from "@/features/dashboard/customer/wishlist/api/wishlist";
import { useWishlistToggle } from "./useWishlistToggle";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const initial = useWishStore.getState();
let root: Root;
let container: HTMLDivElement;
const renderA = vi.fn();
const renderB = vi.fn();
const item = (id: string) => ({ id, variantId: id }) as WishlistItem;
function Card({ id }: { id: string }) {
  const { inWish, busy } = useWishlistToggle(id);
  return <span data-id={id}>{String(inWish)}:{String(busy)}</span>;
}
const render = () => act(() => root.render(<><Profiler id="a" onRender={renderA}><Card id="a" /></Profiler><Profiler id="b" onRender={renderB}><Card id="b" /></Profiler></>));
beforeEach(() => {
  owner.ready = true;
  renderA.mockClear(); renderB.mockClear();
  useWishStore.setState({ ...initial, wishes: [], wishLoading: {} }, true);
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container); render();
});
afterEach(() => {
  act(() => root.unmount()); container.remove(); useWishStore.setState(initial, true);
});
it("updates only the affected product card for wishlist and loading changes", () => {
  const unchanged = renderA.mock.calls.length;
  act(() => useWishStore.setState({ wishes: [item("b")], wishLoading: { b: true } }));
  expect(renderA).toHaveBeenCalledTimes(unchanged);
  expect(container.querySelector('[data-id="a"]')?.textContent).toBe("false:false");
  expect(container.querySelector('[data-id="b"]')?.textContent).toBe("true:true");
});
it("preserves owner readiness gates when a session changes", () => {
  act(() => useWishStore.setState({ wishes: [item("a")] }));
  owner.ready = false; render();
  expect(container.querySelector('[data-id="a"]')?.textContent).toBe("false:true");
  owner.ready = true; render();
  expect(container.querySelector('[data-id="a"]')?.textContent).toBe("true:false");
});
