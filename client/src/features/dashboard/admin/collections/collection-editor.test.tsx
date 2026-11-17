import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  products: vi.fn(),
  save: vi.fn(),
  onSaved: vi.fn()
}));
vi.mock("@/features/dashboard/admin/products/api/products", () => ({
  fetchProductList: mocks.products
}));
vi.mock("./api", () => ({
  saveCollection: mocks.save
}));
import { CollectionEditor } from "./collection-editor";
import type { Collection } from "./api";
(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;
function change(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", {
    bubbles: true
  }));
}
describe("collection editor", () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.products.mockResolvedValue({
      items: [{
        id: "alpha",
        name: "Alpha",
        status: "ACTIVE"
      }, {
        id: "beta",
        name: "Beta",
        status: "ACTIVE"
      }]
    });
    mocks.save.mockResolvedValue({});
    mocks.onSaved.mockResolvedValue(undefined);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    container.remove();
  });
  async function render(collection?: Collection) {
    await act(async () => {
      root.render(createElement(QueryClientProvider, {
        client
      }, createElement(CollectionEditor, {
        collection,
        onSaved: mocks.onSaved,
        onCancel: vi.fn()
      })));
    });
    await act(async () => {
      await new Promise(done => setTimeout(done, 10));
    });
  }
  it("saves selected products in the explicitly chosen order", async () => {
    await render();
    await act(async () => {
      change(container.querySelector<HTMLInputElement>('input[maxlength="120"]')!, "Eid Collection");
    });
    expect(container.querySelector<HTMLInputElement>('input[pattern]')!.value).toBe("eid-collection");
    const choices = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await act(async () => choices[2]!.click());
    await act(async () => choices[1]!.click());
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Move Alpha up"]')!.click());
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", {
        bubbles: true,
        cancelable: true
      }));
    });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      name: "Eid Collection",
      slug: "eid-collection",
      productIds: ["alpha", "beta"],
      source: "MANUAL",
      startsAt: null,
      endsAt: null
    }), undefined);
    expect(mocks.onSaved).toHaveBeenCalledTimes(1);
  });
  it("preserves saved membership and visibility when editing metadata", async () => {
    const collection: Collection = {
      id: "eid",
      name: "Eid",
      slug: "eid",
      description: null,
      source: "MANUAL",
      placement: "HOME",
      limit: 8,
      sortOrder: 2,
      isActive: false,
      startsAt: null,
      endsAt: null,
      products: [{
        productId: "beta",
        sortOrder: 0,
        product: {
          id: "beta",
          name: "Beta",
          status: "ACTIVE",
          deletedAt: null
        }
      }]
    };
    await render(collection);
    await act(async () => {
      change(container.querySelector<HTMLInputElement>('input[maxlength="120"]')!, "Updated Eid");
    });
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", {
        bubbles: true,
        cancelable: true
      }));
    });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      name: "Updated Eid",
      slug: "eid",
      productIds: ["beta"],
      isActive: false,
      sortOrder: 2
    }), "eid");
  });
});
