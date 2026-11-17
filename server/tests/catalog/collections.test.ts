import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  collection: vi.fn(), products: vi.fn(), membership: vi.fn(), invalidate: vi.fn(),
  tx: { productCollection: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, product: { count: vi.fn() }, productCollectionItem: { deleteMany: vi.fn(), createMany: vi.fn() } },
}));
vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { productCollection: { findUnique: mocks.collection }, product: { findMany: mocks.products }, productCollectionItem: { findMany: mocks.membership }, productVariant: { fields: { price: "variant-price-field" } } },
  transaction: async (fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx),
}));
vi.mock("../../src/modules/home/cache.ts", () => ({ invalidateHomeCache: mocks.invalidate }));
import { getCollectionPage, saveCollection } from "../../src/modules/catalog/collection/collection.service.ts";
import { createCollectionSchema, updateCollectionSchema } from "../../src/modules/catalog/collection/collection.validators.ts";
const row = { id: "collection", name: "Eid", slug: "eid", description: null, source: "MANUAL", placement: "HOME", sortOrder: 0, limit: 8, isActive: true, startsAt: null, endsAt: null };
const product = { id: "p1", name: "Panjabi", slug: "panjabi", status: "ACTIVE", images: [], variants: [{ id: "v1", price: 800, compareAtPrice: 1000, inventories: [{ quantityAvailable: 5 }] }] };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.tx.productCollection.findUnique.mockResolvedValue(row);
  mocks.tx.productCollection.create.mockImplementation(async ({ data }) => ({ ...row, ...data }));
  mocks.tx.productCollection.update.mockImplementation(async ({ data }) => ({ ...row, ...data }));
  mocks.tx.product.count.mockResolvedValue(2);
  mocks.collection.mockResolvedValue(row);
  mocks.products.mockResolvedValue([]);
  mocks.membership.mockResolvedValue([]);
});
describe("collection management", () => {
  it("creates ordered membership with one validation query and one batch insert", async () => {
    const input = createCollectionSchema.parse({ name: "Eid", slug: "eid", productIds: ["p2", "p1"] });
    await saveCollection(input);
    expect(mocks.tx.product.count).toHaveBeenCalledTimes(1);
    expect(mocks.tx.productCollectionItem.createMany).toHaveBeenCalledWith({ data: [
      { collectionId: "collection", productId: "p2", sortOrder: 0 },
      { collectionId: "collection", productId: "p1", sortOrder: 1 },
    ] });
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);
  });
  it("rejects unavailable products before writing any collection", async () => {
    mocks.tx.product.count.mockResolvedValue(1);
    await expect(saveCollection(createCollectionSchema.parse({ name: "Eid", slug: "eid", productIds: ["p1", "missing"] }))).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.tx.productCollection.create).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("rejects duplicate membership and keeps partial updates free of defaults", () => {
    expect(createCollectionSchema.safeParse({ name: "Eid", slug: "eid", productIds: ["p1", "p1"] }).success).toBe(false);
    expect(updateCollectionSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });
  it("metadata-only updates preserve existing membership", async () => {
    await saveCollection(updateCollectionSchema.parse({ name: "Summer" }), row.id);
    expect(mocks.tx.productCollectionItem.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.productCollectionItem.createMany).not.toHaveBeenCalled();
    expect(mocks.tx.product.count).not.toHaveBeenCalled();
  });
  it("checks a partial schedule update against the saved end date", async () => {
    mocks.tx.productCollection.findUnique.mockResolvedValue({ ...row, endsAt: new Date("2030-01-01") });
    await expect(saveCollection(updateCollectionSchema.parse({ startsAt: "2031-01-01" }), row.id)).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.tx.productCollection.update).not.toHaveBeenCalled();
  });
});
describe("public collections", () => {
  it("loads manual products in saved order and excludes unpublished products in the query", async () => {
    mocks.membership.mockResolvedValue([{ productId: "p1", sortOrder: 0, product }]);
    const result = await getCollectionPage("eid");
    expect(result.collection.name).toBe("Eid");
    expect(result.items[0]?.variants[0]?.availableStock).toBe(5);
    expect(mocks.membership.mock.calls[0]![0]).toMatchObject({ where: { collectionId: "collection", product: { status: "ACTIVE", deletedAt: null } }, orderBy: [{ sortOrder: "asc" }, { productId: "asc" }] });
  });
  it("uses actual variant sale prices for automatic discount collections", async () => {
    mocks.collection.mockResolvedValue({ ...row, source: "DISCOUNT" });
    await getCollectionPage("eid");
    expect(mocks.products.mock.calls[0]![0].where.AND).toContainEqual({ variants: { some: { deletedAt: null, compareAtPrice: { gt: "variant-price-field" } } } });
  });
  it.each([{ isActive: false }, { startsAt: new Date("2099-01-01") }, { endsAt: new Date("2000-01-01") }])("hides unavailable collection windows: %j", async overrides => {
    mocks.collection.mockResolvedValue({ ...row, ...overrides });
    await expect(getCollectionPage("eid")).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.membership).not.toHaveBeenCalled();
  });
  it("keeps fallback collection links available even when a matching named collection is inactive", async () => {
    mocks.collection.mockResolvedValue({ ...row, slug: "featured", isActive: false });
    const result = await getCollectionPage("default-featured");
    expect(result.collection).toMatchObject({ id: "default-featured", slug: "default-featured" });
    expect(mocks.collection).not.toHaveBeenCalled();
    expect(createCollectionSchema.safeParse({ name: "Reserved", slug: "default-featured" }).success).toBe(false);
  });
  it("serves default collection links when no stored collection exists", async () => {
    mocks.collection.mockResolvedValue(null);
    expect((await getCollectionPage("new-arrivals")).collection.id).toBe("default-new-arrivals");
    await expect(getCollectionPage("unknown")).rejects.toMatchObject({ statusCode: 404 });
  });
});
