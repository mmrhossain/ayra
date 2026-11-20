import { describe, expect, it } from "vitest";
import { categoryPathWhere } from "../../src/modules/catalog/category/services/category-path.ts";

describe("category path lookup", () => {
  it("does not query an empty path", () => { expect(categoryPathWhere([])).toBeNull(); });
  it("requires a root category for a one-segment path", () => {
    expect(categoryPathWhere(["women"])).toEqual({ slug: "women", deletedAt: null, isActive: true, parentId: null });
  });
  it("matches the leaf under its exact active root", () => {
    expect(categoryPathWhere(["women", "saree"])).toEqual({ slug: "saree", deletedAt: null, isActive: true, parent: { is: { slug: "women", deletedAt: null, isActive: true, parentId: null } } });
  });
  it("validates every ancestor for deeper paths", () => {
    expect(categoryPathWhere(["women", "saree", "cotton"])).toEqual({ slug: "cotton", deletedAt: null, isActive: true, parent: { is: { slug: "saree", deletedAt: null, isActive: true, parent: { is: { slug: "women", deletedAt: null, isActive: true, parentId: null } } } } });
  });
  it("preserves admin inactive access while excluding deleted ancestors", () => {
    expect(categoryPathWhere(["women", "saree"], true)).toEqual({ slug: "saree", deletedAt: null, parent: { is: { slug: "women", deletedAt: null, parentId: null } } });
  });
});
