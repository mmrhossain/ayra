import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestProduct,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("GET /home", () => {
  it("returns default sections with server-filtered products", async () => {
    const featured = await createTestProduct(tracker, { isFeatured: true });
    const discounted = await createTestProduct(tracker, {
      price: 80,
      compareAtPrice: 120,
    });
    const newest = await createTestProduct(tracker, { price: 50 });

    const res = await api().get("/api/v1/home");
    expect(res.status).toBe(200);

    const body = res.body.data as {
      sliders: unknown[];
      categories: Array<{ id: string }>;
      sections: Array<{
        id: string;
        type: string;
        title: string;
        source: string;
        href: string;
        products: Array<{ id: string }>;
      }>;
    };

    expect(Array.isArray(body.sliders)).toBe(true);
    expect(Array.isArray(body.categories)).toBe(true);
    expect(Array.isArray(body.sections)).toBe(true);

    const bySource = Object.fromEntries(
      body.sections.map((section) => [section.source, section]),
    );

    expect(bySource.NEW_ARRIVALS?.products.map((p) => p.id)).toContain(
      newest.product.id,
    );
    expect(bySource.FEATURED?.products.map((p) => p.id)).toContain(
      featured.product.id,
    );
    expect(bySource.FEATURED?.products.map((p) => p.id)).not.toContain(
      newest.product.id,
    );
    expect(bySource.DISCOUNT?.products.map((p) => p.id)).toContain(
      discounted.product.id,
    );
    expect(bySource.DISCOUNT?.products.map((p) => p.id)).not.toContain(
      newest.product.id,
    );
  });

  it("uses HOME collections for section order when they exist", async () => {
    const featured = await createTestProduct(tracker, { isFeatured: true });
    const collection = await prisma.productCollection.create({
      data: {
        name: "Eid Picks",
        slug: `eid-picks-${Date.now()}`,
        source: "FEATURED",
        placement: "HOME",
        sortOrder: 0,
        limit: 8,
        isActive: true,
      },
    });
    tracker.collectionIds.push(collection.id);

    const res = await api().get("/api/v1/home");
    expect(res.status).toBe(200);

    const sections = res.body.data.sections as Array<{
      id: string;
      title: string;
      source: string;
      products: Array<{ id: string }>;
    }>;

    expect(sections[0]?.id).toBe(collection.id);
    expect(sections[0]?.title).toBe("Eid Picks");
    expect(sections[0]?.products.map((p) => p.id)).toContain(featured.product.id);
  });
});
