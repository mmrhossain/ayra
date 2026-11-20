import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ fetchFacets: vi.fn(), search: new URLSearchParams(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocked.push }), usePathname: () => "/shop/women/saree", useSearchParams: () => mocked.search }));
vi.mock("@/features/catalog/api", async importOriginal => ({ ...await importOriginal<typeof import("@/features/catalog/api")>(), fetchProductFacets: mocked.fetchFacets }));
vi.mock("@/components/ui/drawer", () => {
  const Wrapper = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return { Drawer: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <section>{children}</section> : null, DrawerContent: Wrapper, DrawerHeader: Wrapper, DrawerTitle: Wrapper, DrawerClose: Wrapper };
});
import DynamicFilterBar from "./DynamicFilter";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement; let root: Root; let client: QueryClient;
const response = { categories: [{ id: "cotton", slug: "cotton", label: "Cotton" }], attributes: [], price: { min: 100, max: 200, buckets: [] } };
const render = (categories?: string[]) => act(() => root.render(<QueryClientProvider client={client}><DynamicFilterBar facetParams={{ category: "women/saree", categories }} /></QueryClientProvider>));
const open = async () => {
  await act(async () => { container.querySelector<HTMLButtonElement>('button[aria-label^="Filters"]')!.click(); });
  await vi.waitFor(async () => {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(container.querySelector('[role="status"][aria-label="Loading filter options"]')).toBeNull();
  });
};
beforeEach(() => { mocked.fetchFacets.mockReset().mockResolvedValue(response); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); });
it("loads no facets for a closed drawer and reuses them when reopened", async () => {
  render(); expect(mocked.fetchFacets).not.toHaveBeenCalled(); await open(); expect(mocked.fetchFacets).toHaveBeenCalledTimes(1); expect(container.textContent).toContain("Cotton");
  act(() => Array.from(container.querySelectorAll("button")).find(b => b.textContent === "View results")!.click());
  await open(); expect(mocked.fetchFacets).toHaveBeenCalledTimes(1);
});
it("loads the exact new filter scope only when the drawer opens", async () => {
  render(); render(["cotton"]); expect(mocked.fetchFacets).not.toHaveBeenCalled(); await open();
  expect(mocked.fetchFacets).toHaveBeenCalledWith({ category: "women/saree", categories: ["cotton"] });
});
it("keeps the existing error message when facet loading fails", async () => {
  mocked.fetchFacets.mockRejectedValue(new Error("Unavailable")); render(); await open(); expect(container.textContent).toContain("Filter options couldn?t load.");
});
