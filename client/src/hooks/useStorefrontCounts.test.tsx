import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useStorefrontCountBadge, useStorefrontCountQuery, useStorefrontCounts } from "./useStorefrontCounts";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";

const mocks = vi.hoisted(() => ({
  session: { owner: null as string | null },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/api/auth/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: mocks.session.owner ? { user: { id: mocks.session.owner, role: "CUSTOMER" } } : null,
      isPending: false,
    }),
  },
}));
vi.mock("@/lib/api/dashboard", () => ({ dashboardApi: mocks, DashboardApiError: class extends Error {} }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function cart(quantity: number) {
  return { data: { items: quantity ? [{ variantId: "v", quantity }] : [] } };
}

function Badges() {
  const bag = useStorefrontCountBadge("cart");
  const wish = useStorefrontCountBadge("wishlist");
  useStorefrontCountQuery("cart");
  useStorefrontCountQuery("wishlist");
  return <output>{[bag, wish].map(badge => badge.loading ? "loading" : badge.count ?? "unknown").join("/")}</output>;
}

function Page() {
  useStorefrontCounts();
  return <><Badges /><Badges /></>;
}

it("shares reads, retains counts on failure, applies cart writes, and isolates account switches", async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const client = new QueryClient();
  const render = () => root.render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
  const counts = () => [...container.querySelectorAll("output")].map(output => output.textContent);
  const wishlist = { data: { items: [{ variantId: "v" }], pagination: { total: 1 } } };
  try {
    await act(async () => render());
    expect(counts()).toEqual(["0/unknown", "0/unknown"]);
    expect(mocks.get).not.toHaveBeenCalled();

    let finishCart!: (value: ReturnType<typeof cart>) => void;
    mocks.get.mockImplementation((route: string) => route === "/cart"
      ? new Promise(resolve => { finishCart = resolve; })
      : Promise.resolve(wishlist));
    mocks.session.owner = "first";
    await act(async () => render());
    expect(counts()).toEqual(["loading/1", "loading/1"]);
    expect(mocks.get).toHaveBeenCalledTimes(2);
    await act(async () => finishCart(cart(2)));
    expect(counts()).toEqual(["2/1", "2/1"]);

    mocks.get.mockRejectedValueOnce(new Error("Network unavailable"));
    await act(async () => {
      await client.refetchQueries({ queryKey: ["storefront-cart", "first"] });
    });
    expect(counts()).toEqual(["2/1", "2/1"]);

    mocks.put.mockResolvedValue(cart(3));
    mocks.post.mockResolvedValue(cart(4));
    mocks.delete.mockResolvedValue(cart(0));
    mocks.get.mockClear();
    await act(async () => { await useCartStore.getState().updateCart("v", 3); });
    expect(counts()).toEqual(["3/1", "3/1"]);
    await act(async () => { await useCartStore.getState().addToCart("v", 1); });
    expect(counts()).toEqual(["4/1", "4/1"]);
    await act(async () => { await useCartStore.getState().removeFromCart("v"); });
    expect(counts()).toEqual(["0/1", "0/1"]);
    expect(mocks.get).not.toHaveBeenCalled();

    mocks.get.mockResolvedValueOnce({ data: { items: [], pagination: { total: 0 } } });
    await act(async () => { await useWishStore.getState().removeFromWishList("v"); });
    expect(counts()).toEqual(["0/0", "0/0"]);
    expect(mocks.get.mock.calls).toEqual([
      ["/wishlist/items", { cache: "no-store", params: { page: 1, limit: 50 } }],
    ]);
    mocks.get.mockClear();

    mocks.get.mockImplementation((route: string) => route === "/cart"
      ? Promise.reject(new Error("Network unavailable"))
      : Promise.resolve({ data: { items: [], pagination: { total: 0 } } }));
    mocks.session.owner = "second";
    await act(async () => render());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(counts()).toEqual(["unknown/0", "unknown/0"]);
    expect(client.getQueryState(["storefront-cart", "first"])).toBeUndefined();

    mocks.session.owner = null;
    await act(async () => render());
    expect(counts()).toEqual(["0/unknown", "0/unknown"]);
    expect(mocks.get).toHaveBeenCalledTimes(2);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
