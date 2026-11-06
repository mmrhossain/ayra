import { beforeEach, describe, expect, it, vi } from "vitest";

const product = { findMany: vi.fn(), updateMany: vi.fn() };
const category = { findFirst: vi.fn() };
const cacheDel = vi.fn();
const invalidateCatalogCache = vi.fn();
const deleteProduct = vi.fn();

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { product, category },
}));

vi.mock("../../src/lib/cache.ts", () => ({
  CacheKeys: { productSlug: (slug: string) => `product:${slug}` },
  cacheDel: (...args: unknown[]) => cacheDel(...args),
  invalidateCatalogCache: (...args: unknown[]) => invalidateCatalogCache(...args),
}));

vi.mock("../../src/modules/catalog/product/services/product.service.ts", () => ({
  deleteProduct: (...args: unknown[]) => deleteProduct(...args),
}));

const { bulkUpdateProducts } = await import(
  "../../src/modules/catalog/product/services/product-bulk.service.ts"
);

describe("bulkUpdateProducts", () => {
  beforeEach(() => {
    product.findMany.mockReset();
    product.updateMany.mockReset();
    category.findFirst.mockReset();
    cacheDel.mockReset();
    invalidateCatalogCache.mockReset();
    deleteProduct.mockReset();
  });

  it("sets status for known ids and reports unknown ids as failed", async () => {
    product.findMany.mockResolvedValue([
      { id: "p1", slug: "one" },
      { id: "p2", slug: "two" },
    ]);
    product.updateMany.mockResolvedValue({ count: 2 });

    const result = await bulkUpdateProducts({
      type: "set-status",
      ids: ["p1", "p2", "missing"],
      status: "ACTIVE",
    });

    expect(result).toEqual({ requested: 3, affected: 2, failed: ["missing"] });
    expect(product.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1", "p2"] }, deletedAt: null },
      data: { status: "ACTIVE" },
    });
    expect(invalidateCatalogCache).toHaveBeenCalledTimes(1);
    expect(cacheDel).toHaveBeenCalledWith("product:one", "product:two");
  });

  it("deduplicates ids before querying", async () => {
    product.findMany.mockResolvedValue([{ id: "p1", slug: "one" }]);
    product.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulkUpdateProducts({
      type: "set-featured",
      ids: ["p1", "p1"],
      isFeatured: true,
    });

    expect(result.requested).toBe(1);
    expect(product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1"] }, deletedAt: null },
      select: { id: true, slug: true },
    });
  });

  it("rejects a category action when the category does not exist", async () => {
    product.findMany.mockResolvedValue([{ id: "p1", slug: "one" }]);
    category.findFirst.mockResolvedValue(null);

    await expect(
      bulkUpdateProducts({
        type: "set-category",
        ids: ["p1"],
        categoryId: "c-missing",
      }),
    ).rejects.toThrow("Category not found");
    expect(product.updateMany).not.toHaveBeenCalled();
  });

  it("deletes in a bounded fan-out and reports rejected ids", async () => {
    deleteProduct
      .mockResolvedValueOnce({ id: "p1" })
      .mockRejectedValueOnce(new Error("Product not found"));

    const result = await bulkUpdateProducts({
      type: "delete",
      ids: ["p1", "p2"],
    });

    expect(result).toEqual({ requested: 2, affected: 1, failed: ["p2"] });
    expect(deleteProduct).toHaveBeenCalledTimes(2);
  });
});
