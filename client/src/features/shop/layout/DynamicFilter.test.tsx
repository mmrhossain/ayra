import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { ProductFacets } from "@/features/catalog/api";
import DynamicFilterBar from "./DynamicFilter";

const { searchParams, push } = vi.hoisted(() => ({
  searchParams: new URLSearchParams("sort=price_asc&minPrice=100&maxPrice=200&collection=eid"),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerClose: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));

it("shows the controls before facets resolve and loads the options inside the open drawer", async () => {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  let resolveFacets!: (value: ProductFacets) => void;
  const facets = new Promise<ProductFacets>(resolve => { resolveFacets = resolve; });

  try {
    await act(async () => root.render(<DynamicFilterBar facets={facets} />));
    const filter = container.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')!;
    expect(filter.getAttribute("aria-label")).toBe("Filters, 1 active");
    expect(container.querySelector("summary")?.textContent).toContain("Price: Low to High");
    await act(async () => container.querySelector("summary")!.click());
    const sort = container.querySelector("details")!;
    expect(sort.open).toBe(true);
    const newest = Array.from(sort.querySelectorAll("button")).find(button => button.textContent === "Newest")!;
    await act(async () => newest.click());
    expect(sort.open).toBe(true);
    expect(push).toHaveBeenCalledWith("/shop?minPrice=100&maxPrice=200&collection=eid&page=1", { scroll: false });
    await act(async () => filter.click());
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Loading filter options");

    await act(async () => resolveFacets({
      price: { min: 100, max: 200, buckets: [{ from: 100, to: 200 }] },
      attributes: [{ attributeId: "size", name: "Size", options: [{ valueId: "small", label: "Small" }] }],
    }));
    expect(container.textContent).toContain("Small");
    expect(container.querySelector("input:checked")).not.toBeNull();
    expect(filter.getAttribute("aria-expanded")).toBe("true");
  } finally {
    await act(async () => root.unmount());
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
