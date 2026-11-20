import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmProductLeave } from "./product-leave";
afterEach(() => vi.restoreAllMocks());
describe("existing product leave guard", () => {
  it("blocks leaving during save without prompting", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    expect(confirmProductLeave(true, true)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
  it("allows leaving unchanged products without prompting", () => {
    const confirm = vi.spyOn(window, "confirm");
    expect(confirmProductLeave(false, false)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
  it.each([false, true])("honors the unsaved-change confirmation: %s", decision => {
    vi.spyOn(window, "confirm").mockReturnValue(decision);
    expect(confirmProductLeave(false, true)).toBe(decision);
  });
});
