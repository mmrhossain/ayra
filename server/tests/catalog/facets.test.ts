import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  attachVariantAttributeValues,
  createAttributeGroup,
  createTestProduct,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

// The remote Neon compute auto-suspends, so the first connections after a cold
// start intermittently fail with ETIMEDOUT before the pool establishes itself.
// Retry only 5xx responses so a genuine server bug still fails the assertion.
const withDbRetry = async <T extends { status: number }>(
  send: () => Promise<T>,
  attempts = 4,
): Promise<T> => {
  let res = await send();
  for (let attempt = 2; attempt <= attempts && res.status >= 500; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    res = await send();
  }
  return res;
};

afterEach(async () => {
  await tracker.cleanup();
});

describe("listProducts attribute filtering", () => {
  it("matches OR within a group and AND across groups", async () => {
    const colour = await createAttributeGroup(tracker, "Colour", ["Red", "Blue"]);
    const size = await createAttributeGroup(tracker, "Size", ["S", "M"]);

    const redS = await createTestProduct(tracker, { price: 100 });
    const blueM = await createTestProduct(tracker, { price: 200 });
    const redM = await createTestProduct(tracker, { price: 300 });

    await attachVariantAttributeValues(redS.variant.id, [
      colour.values[0].id,
      size.values[0].id,
    ]);
    await attachVariantAttributeValues(blueM.variant.id, [
      colour.values[1].id,
      size.values[1].id,
    ]);
    await attachVariantAttributeValues(redM.variant.id, [
      colour.values[0].id,
      size.values[1].id,
    ]);

    const orRes = await withDbRetry(() =>
      api()
        .get("/api/v1/products")
        .query({
          attrs: `${colour.attribute.id}:${colour.values[0].id},${colour.values[1].id}`,
          limit: 100,
        }),
    );
    expect(orRes.status).toBe(200);
    const orIds = (orRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id,
    );
    expect(orIds).toEqual(
      expect.arrayContaining([
        redS.product.id,
        blueM.product.id,
        redM.product.id,
      ]),
    );

    const andRes = await withDbRetry(() =>
      api()
        .get("/api/v1/products")
        .query({
          attrs: `${colour.attribute.id}:${colour.values[0].id}~${size.attribute.id}:${size.values[1].id}`,
          limit: 100,
        }),
    );
    expect(andRes.status).toBe(200);
    const andIds = (andRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id,
    );
    expect(andIds).toContain(redM.product.id);
    expect(andIds).not.toContain(redS.product.id);
    expect(andIds).not.toContain(blueM.product.id);
  });

  it("scopes to selected category slugs", async () => {
    const first = await createTestProduct(tracker, { price: 100 });
    const second = await createTestProduct(tracker, { price: 200 });

    const singleRes = await withDbRetry(() =>
      api()
        .get("/api/v1/products")
        .query({ categories: first.category.slug, limit: 100 }),
    );
    const singleIds = (singleRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id,
    );
    expect(singleIds).toContain(first.product.id);
    expect(singleIds).not.toContain(second.product.id);

    const multiRes = await withDbRetry(() =>
      api()
        .get("/api/v1/products")
        .query({
          categories: `${first.category.slug},${second.category.slug}`,
          limit: 100,
        }),
    );
    const multiIds = (multiRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id,
    );
    expect(multiIds).toEqual(
      expect.arrayContaining([first.product.id, second.product.id]),
    );
  });

  it("ignores unknown attribute values without crashing", async () => {
    const res = await withDbRetry(() =>
      api()
        .get("/api/v1/products")
        .query({ attrs: "unknown-attribute:unknown-value", limit: 100 }),
    );
    expect(res.status).toBe(200);
  });
});

describe("GET /products/facets", () => {
  it("returns only attribute values present on scoped live products", async () => {
    const colour = await createAttributeGroup(tracker, "Colour", ["Red", "Blue"]);
    const productA = await createTestProduct(tracker, { price: 500 });
    const productB = await createTestProduct(tracker, { price: 1500 });

    await attachVariantAttributeValues(productA.variant.id, [colour.values[0].id]);
    await attachVariantAttributeValues(productB.variant.id, [colour.values[1].id]);

    const res = await withDbRetry(() =>
      api()
        .get("/api/v1/products/facets")
        .query({ category: productA.category.slug }),
    );

    expect(res.status).toBe(200);
    const body = res.body.data as {
      price: { min: number | null; max: number | null; buckets: unknown[] };
      attributes: Array<{ name: string; options: Array<{ label: string }> }>;
    };

    const colourFacet = body.attributes.find(
      (attribute) => attribute.name === colour.attribute.name,
    );
    expect(colourFacet).toBeDefined();
    expect(colourFacet?.options.map((option) => option.label)).toEqual(["Red"]);
    expect(body.price.min).toBe(500);
    expect(body.price.max).toBe(500);
    expect(body.price.buckets).toEqual([]);
  });

  it("returns direct child categories when present", async () => {
    const parent = await createTestProduct(tracker, { price: 100 });
    const tag = parent.category.id.slice(0, 8);
    const child = await prisma.category.create({
      data: {
        name: `Child ${tag}`,
        slug: `child-${tag}`,
        parentId: parent.category.id,
        isActive: true,
      },
    });
    tracker.categoryIds.push(child.id);

    const res = await withDbRetry(() =>
      api()
        .get("/api/v1/products/facets")
        .query({ category: parent.category.slug }),
    );

    expect(res.status).toBe(200);
    expect((res.body.data as { categories?: unknown[] }).categories).toEqual([
      { id: child.id, slug: child.slug, label: child.name },
    ]);
  });

  it("returns empty facets for an empty scope", async () => {
    const res = await withDbRetry(() =>
      api()
        .get("/api/v1/products/facets")
        .query({ search: "no-such-product-xyz-123" }),
    );

    expect(res.status).toBe(200);
    const body = res.body.data as {
      price: { min: number | null; max: number | null; buckets: unknown[] };
      attributes: unknown[];
    };
    expect(body.price).toEqual({ min: null, max: null, buckets: [] });
    expect(body.attributes).toEqual([]);
  });
});

describe("buildPriceBuckets", () => {
  it("returns [] when there is no usable range", async () => {
    const { buildPriceBuckets } = await import(
      "../../src/modules/catalog/product/services/product-facets.service.ts"
    );
    expect(buildPriceBuckets(null, null)).toEqual([]);
    expect(buildPriceBuckets(500, 500)).toEqual([]);
  });

  it("produces contiguous round buckets covering the range", async () => {
    const { buildPriceBuckets } = await import(
      "../../src/modules/catalog/product/services/product-facets.service.ts"
    );
    const buckets = buildPriceBuckets(500, 45000);
    expect(buckets).toEqual([
      { from: 0, to: 10000 },
      { from: 10000, to: 20000 },
      { from: 20000, to: 30000 },
      { from: 30000, to: 40000 },
      { from: 40000, to: 50000 },
    ]);
  });
});
