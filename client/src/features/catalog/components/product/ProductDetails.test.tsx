import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "@/features/catalog/types";
const mocks = vi.hoisted(() => ({ add: vi.fn(), refresh: vi.fn(), error: vi.fn(), success: vi.fn(), push: vi.fn() }));
vi.mock("@/features/cart/api", () => ({ addCartItem: mocks.add, toCartErrorMessage: (error: Error) => error.message }));
vi.mock("@/stores/useCartStore", () => ({ useCartStore: { getState: () => ({ fetchCart: mocks.refresh }) } }));
vi.mock("@/helpers", () => ({ errorToast: mocks.error, successToast: mocks.success, formatPrice: (value: number) => String(value) }));
vi.mock("@/lib/api/auth/auth-client", () => ({ authClient: { useSession: () => ({ data: { user: { id: "customer", role: "customer" } } }) } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/useWishlistToggle", () => ({ useWishlistToggle: () => ({ inWish: false, busy: false, toggleWishlist: vi.fn() }) }));
vi.mock("@/components/shared/page-breadcrumb", () => ({ default: () => null }));
vi.mock("./ProductGallery", () => ({ default: () => null }));
import ProductDetails from "./ProductDetails";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const attributes = [
  { attributeValue: { id: "medium", value: "Medium", attributeId: "size", attribute: { id: "size", name: "Size" } } },
  { attributeValue: { id: "blue", value: "Blue", attributeId: "color", attribute: { id: "color", name: "Color" } } },
];
function product(options: { simple?: boolean; stock?: number; oneAttribute?: boolean } = {}): ProductDetail {
  return { id: "p1", name: "Shirt", slug: "shirt", status: "ACTIVE", isFeatured: false, images: [],
    variants: [{ id: "v1", sku: "SHIRT-M-BLUE", price: 100, availableStock: options.stock ?? 5, isDefault: true,
      attributes: options.simple ? [] : options.oneAttribute ? attributes.slice(0, 1) : attributes }],
  } as ProductDetail;
}
describe("Add to Bag workflow", () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    vi.resetAllMocks(); mocks.add.mockResolvedValue({ message: "Added" }); mocks.refresh.mockResolvedValue(undefined);
    vi.stubGlobal("IntersectionObserver", class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() { this.callback([{ isIntersecting: false } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
      disconnect() {}
    });
    container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  async function render(value = product()) { await act(async () => { root.render(createElement(ProductDetails, { product: value })); }); }
  function buttons() { return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).filter(button => ["Add to Bag", "Processing...", "Out of stock", "Unavailable"].includes(button.textContent?.trim() ?? "")); }
  async function select(index: number, value: string) {
    const trigger = container.querySelectorAll<HTMLButtonElement>('button[id^="product-attribute-trigger-"]')[index]!;
    if (trigger.getAttribute("aria-expanded") === "false") await act(async () => trigger.click());
    const options = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(options?.closest("[data-radix-popper-content-wrapper]")).not.toBeNull();
    const option = Array.from(options.querySelectorAll<HTMLInputElement>("input")).find(input => input.value === value)!;
    await act(async () => option.click());
    expect(option.checked).toBe(true);
    expect(options.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  }
  it.each([0, 1])("button %i validates missing attributes instead of disabling the Add to Bag action", async index => {
    await render();
    expect(buttons()).toHaveLength(2);
    expect(buttons().every(button => !button.disabled)).toBe(true);
    expect(container.textContent).not.toContain("Select options");
    await act(async () => buttons()[index]!.click());
    expect(mocks.error).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Please select size.");
    expect(container.textContent).toContain("Please select color.");
    expect(mocks.add).not.toHaveBeenCalled();
    await select(0, "medium");
    expect(container.textContent).not.toContain("Please select size.");
    expect(container.textContent).toContain("Please select color.");
    await select(1, "blue");
    await act(async () => buttons()[index]!.click());
    expect(mocks.add).toHaveBeenCalledWith("v1", 1, expect.objectContaining({ unitPrice: 100, productName: "Shirt" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
  it("requires only the attributes actually assigned to the product", async () => {
    await render(product({ oneAttribute: true }));
    await act(async () => buttons()[1]!.click());
    expect(mocks.error).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("Please select color.");
    await select(0, "medium");
    await act(async () => buttons()[1]!.click());
    expect(mocks.add).toHaveBeenCalledTimes(1);
  });
  it("adds a simple product without asking for options", async () => {
    await render(product({ simple: true }));
    await act(async () => buttons()[1]!.click());
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.add).toHaveBeenCalledWith("v1", 1, expect.any(Object));
  });
  it("shares loading state and prevents duplicate main/sticky submissions", async () => {
    let resolve!: (value: { message: string }) => void;
    mocks.add.mockReturnValue(new Promise(done => { resolve = done; }));
    await render(product({ simple: true }));
    await act(async () => { const actions = buttons(); actions[0]!.click(); actions[1]!.click(); });
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(buttons().every(button => button.disabled && button.textContent?.trim() === "Processing...")).toBe(true);
    await act(async () => { resolve({ message: "Added" }); });
    expect(buttons().every(button => !button.disabled && button.textContent?.trim() === "Add to Bag")).toBe(true);
  });
  it("uses the same unavailable state for an option combination that does not exist", async () => {
    const value = product();
    value.variants.push({ ...value.variants[0], id: "v2", isDefault: false, attributes: [
      { attributeValue: { id: "large", value: "Large", attributeId: "size", attribute: { id: "size", name: "Size" } } },
      { attributeValue: { id: "red", value: "Red", attributeId: "color", attribute: { id: "color", name: "Color" } } },
    ] });
    await render(value);
    await select(0, "medium");
    await select(1, "red");
    expect(buttons()).toHaveLength(2);
    expect(buttons().every(button => button.disabled && button.textContent?.trim() === "Unavailable")).toBe(true);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("keeps both buttons disabled for a genuinely out-of-stock selection", async () => {
    await render(product({ simple: true, stock: 0 }));
    expect(buttons()).toHaveLength(2);
    expect(buttons().every(button => button.disabled && button.textContent?.trim() === "Out of stock")).toBe(true);
    expect(mocks.add).not.toHaveBeenCalled();
  });
});
