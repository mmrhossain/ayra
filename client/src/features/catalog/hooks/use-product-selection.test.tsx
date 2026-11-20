import { act, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useProductSelection } from "./use-product-selection";
import type { ProductDetail, ProductVariant } from "@/features/catalog/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const variant = (id: string, color: string, size: string, stock: number): ProductVariant => ({
  id, sku: id, price: id === "red-s" ? 100 : 200, availableStock: stock, isDefault: id === "red-s",
  attributes: [["color", color], ["size", size]].map(([attributeId, value]) => ({
    attributeValue: { id: attributeId + value, value, attributeId, attribute: { id: attributeId, name: attributeId } },
  })),
});
let product: ProductDetail;
let state: ReturnType<typeof useProductSelection>;
let root: Root;
let container: HTMLDivElement;
function Harness() { const selection = useProductSelection(product); useLayoutEffect(() => { state = selection; }); return null; }
const render = () => act(() => root.render(<Harness />));
const select = (color: string, size: string) => act(() => {
  state.setAttributeValue("color", "color" + color);
  state.setAttributeValue("size", "size" + size);
});
beforeEach(() => {
  product = { id: "p", name: "Test", slug: "test", variants: [variant("red-s", "red", "s", 5), variant("red-m", "red", "m", 0), variant("blue-s", "blue", "s", 2)] };
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); render();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
describe("product option stock synchronization", () => {
  it("does not expose default stock before all options are selected", () => {
    expect(state.selected).toBeNull(); expect(state.stock).toBe(0); expect(state.canAddToCart).toBe(false);
    act(() => state.setAttributeValue("color", "colorred"));
    expect(state.isComplete).toBe(false); expect(state.stock).toBe(0);
  });
  it("synchronizes variant, price, stock and quantity when changing options", () => {
    select("red", "s"); expect(state.selectedId).toBe("red-s"); expect(state.stock).toBe(5); expect(state.price).toBe(100);
    act(() => state.setQuantity(4)); expect(state.quantity).toBe(4);
    select("blue", "s"); expect(state.selectedId).toBe("blue-s"); expect(state.stock).toBe(2); expect(state.price).toBe(200); expect(state.quantity).toBe(1);
  });
  it("rejects sold-out and nonexistent combinations without using default stock", () => {
    select("red", "m"); expect(state.selectedId).toBe("red-m"); expect(state.stock).toBe(0); expect(state.canAddToCart).toBe(false);
    select("blue", "m"); expect(state.isComplete).toBe(true); expect(state.selected).toBeNull(); expect(state.stock).toBe(0); expect(state.canAddToCart).toBe(false);
  });
  it("clamps quantity when refreshed inventory shrinks", () => {
    select("red", "s"); act(() => state.setQuantity(5));
    product = { ...product, variants: product.variants.map(v => ({ ...v, availableStock: 2 })) }; render();
    expect(state.stock).toBe(2); expect(state.quantity).toBe(2);
    act(() => state.setQuantity(100)); expect(state.quantity).toBe(2);
  });
  it("supports products without attributes", () => {
    product = { ...product, variants: [{ id: "plain", sku: "plain", price: 50, availableStock: 3 }] }; render();
    expect(state.isComplete).toBe(true); expect(state.selectedId).toBe("plain"); expect(state.stock).toBe(3); expect(state.canAddToCart).toBe(true);
  });
});
