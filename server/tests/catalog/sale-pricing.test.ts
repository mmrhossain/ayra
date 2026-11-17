import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), invalidate: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: { productVariant: { findUnique: mocks.find } }, transaction: async (fn: (tx: unknown) => unknown) => fn({ productVariant: { update: mocks.update } }) }));
vi.mock("../../src/lib/cache.ts", () => ({ invalidateCatalogCacheForVariants: mocks.invalidate }));
import { updateVariant } from "../../src/modules/catalog/product/services/product-variant.service.ts";
import { updateVariantSchema } from "../../src/modules/catalog/product/validators/product.validators.ts";
import { validatePricing } from "../../src/modules/catalog/product/utils/product-validation.ts";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue({ id: "v1", productId: "p1", price: 800, compareAtPrice: 1000 });
  mocks.update.mockResolvedValue({ id: "v1", price: 800, compareAtPrice: null });
});
describe("sale pricing", () => {
  it("supports clearing a compare-at price without coercing null to zero", async () => {
    const input = updateVariantSchema.parse({ compareAtPrice: null });
    await updateVariant("v1", input);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { compareAtPrice: null } });
    expect(mocks.invalidate).toHaveBeenCalledWith(["v1"]);
  });
  it("validates a changed compare-at price against the current selling price", async () => {
    await expect(updateVariant("v1", { compareAtPrice: 700 })).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("validates a changed selling price against the saved reference price", async () => {
    await expect(updateVariant("v1", { price: 1100 })).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("preserves normal and equal reference prices without allowing a lower reference", () => {
    expect(() => validatePricing({ price: 800, compareAtPrice: null })).not.toThrow();
    expect(() => validatePricing({ price: 800, compareAtPrice: 1000 })).not.toThrow();
    expect(() => validatePricing({ price: 800, compareAtPrice: 800 })).not.toThrow();
    expect(() => validatePricing({ price: 800, compareAtPrice: 700 })).toThrow();
  });
});
