import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SearchBox from "./SearchBox";

const mocks = vi.hoisted(() => ({
  fetchProductList: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/features/catalog/api", () => ({
  fetchProductList: mocks.fetchProductList,
  productPrice: (product: { variants: Array<{ price: number | string }> }) =>
    Math.min(...product.variants.map((variant) => Number(variant.price))),
  toCatalogErrorMessage: () => "Could not load suggestions",
}));

vi.mock("@/components/shared/store-image", () => ({
  default: () => null,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      ...props
    }: React.ComponentProps<"a"> & { href: string }) =>
      React.createElement("a", { href, ...props }, children),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const products = [
  {
    id: "product-1",
    name: "Classic Panjabi",
    slug: "classic-panjabi",
    status: "ACTIVE" as const,
    isFeatured: false,
    images: [],
    variants: [{ id: "variant-1", price: 2500 }],
  },
];

describe("SearchBox product suggestions", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mocks.fetchProductList.mockReset();
    mocks.fetchProductList.mockResolvedValue({
      items: products,
      pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
    });
    mocks.push.mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
  });

  it("shows product matches and opens the selected product from the keyboard", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <SearchBox />
        </QueryClientProvider>,
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Search products"]',
    );
    expect(input).not.toBeNull();

    await act(async () => {
      input?.focus();
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setValue?.call(input, "panjabi");
      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(mocks.fetchProductList).toHaveBeenCalledWith({
      page: 1,
      limit: 6,
      search: "panjabi",
      includeInactive: false,
    });
    expect(container.querySelector('[role="option"]')?.textContent).toContain(
      "Classic Panjabi",
    );

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });
    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(mocks.push).toHaveBeenCalledWith(
      "/product-details/classic-panjabi",
    );
  });
});
