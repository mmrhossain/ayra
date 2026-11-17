import { act, createElement, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const router = vi.hoisted(() => ({ back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, onOpenChange }: { children: ReactNode; onOpenChange: (open: boolean) => void }) =>
    createElement("div", null, createElement("button", { onClick: () => onOpenChange(false), id: "close" }, "Close"), children),
  SheetContent: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  SheetTitle: ({ children }: { children: ReactNode }) => createElement("h2", null, children),
  SheetDescription: ({ children }: { children: ReactNode }) => createElement("p", null, children),
}));
import { ProductWizardSheet, useProductEditorClose } from "./product-wizard-sheet";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
function Editor({ guard }: { guard: () => boolean }) {
  const close = useProductEditorClose();
  useEffect(() => close?.registerGuard(guard), [close, guard]);
  return createElement("button", { id: "back", onClick: close?.requestClose }, "Back to products");
}
describe("Product editor close handling", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    router.back.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  async function render(guard?: () => boolean) {
    await act(async () => root.render(createElement(ProductWizardSheet, null, guard ? createElement(Editor, { guard }) : null)));
  }
  async function click(id: string) {
    await act(async () => container.querySelector<HTMLButtonElement>(id)!.click());
  }
  it("closes a clean editor through the sheet close control", async () => {
    await render(() => true);
    await click("#close");
    expect(router.back).toHaveBeenCalledOnce();
  });
  it("blocks both close controls when the editor rejects leaving", async () => {
    const guard = vi.fn(() => false);
    await render(guard);
    await click("#close");
    await click("#back");
    expect(guard).toHaveBeenCalledTimes(2);
    expect(router.back).not.toHaveBeenCalled();
  });
  it("uses the latest guard after editor state changes", async () => {
    await render(() => false);
    await click("#close");
    await render(() => true);
    await click("#back");
    expect(router.back).toHaveBeenCalledOnce();
  });
  it("removes the guard when the editor unmounts", async () => {
    await render(() => false);
    await render();
    await click("#close");
    expect(router.back).toHaveBeenCalledOnce();
  });
});
