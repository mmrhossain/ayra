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

describe("GET /products cursor pagination", () => {
  it("continues the newest list without repeating products", async () => {
    const first = await createTestProduct(tracker);
    const second = await createTestProduct(tracker);
    const third = await createTestProduct(tracker);
    await Promise.all([
      prisma.product.update({
        where: { id: first.product.id },
        data: { createdAt: new Date("2020-01-01T00:00:00.000Z") },
      }),
      prisma.product.update({
        where: { id: second.product.id },
        data: { createdAt: new Date("2021-01-01T00:00:00.000Z") },
      }),
      prisma.product.update({
        where: { id: third.product.id },
        data: { createdAt: new Date("2022-01-01T00:00:00.000Z") },
      }),
    ]);
    await prisma.product.updateMany({
      where: {
        id: { in: [first.product.id, second.product.id, third.product.id] },
      },
      data: { categoryId: first.category.id },
    });

    const firstPage = await api().get(
      `/api/v1/products?limit=2&category=${first.category.slug}`
    );
    expect(firstPage.status).toBe(200);
    const firstData = firstPage.body.data as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };
    expect(firstData.items.map((item) => item.id)).toEqual([
      third.product.id,
      second.product.id,
    ]);
    expect(firstData.nextCursor).toBeTruthy();

    const secondPage = await api().get(
      `/api/v1/products?limit=2&category=${first.category.slug}&cursor=${encodeURIComponent(firstData.nextCursor!)}`
    );
    expect(secondPage.status).toBe(200);
    const secondData = secondPage.body.data as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };
    const returnedIds = [
      ...firstData.items.map((item) => item.id),
      ...secondData.items.map((item) => item.id),
    ];
    expect(new Set(returnedIds).size).toBe(returnedIds.length);
    expect(secondData.items.map((item) => item.id)).toContain(first.product.id);
  });

  it("continues price-sorted results using the product's minimum variant price", async () => {
    const low = await createTestProduct(tracker, { price: 10 });
    const middle = await createTestProduct(tracker, { price: 20 });
    const high = await createTestProduct(tracker, { price: 30 });
    await prisma.product.updateMany({
      where: {
        id: { in: [low.product.id, middle.product.id, high.product.id] },
      },
      data: { categoryId: low.category.id },
    });

    const firstPage = await api().get(
      `/api/v1/products?limit=1&sort=price_asc&category=${low.category.slug}`
    );
    expect(firstPage.status).toBe(200);
    const firstData = firstPage.body.data as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };
    expect(firstData.items[0]?.id).toBe(low.product.id);
    expect(firstData.nextCursor).toBeTruthy();

    const secondPage = await api().get(
      `/api/v1/products?limit=1&sort=price_asc&category=${low.category.slug}&cursor=${encodeURIComponent(firstData.nextCursor!)}`
    );
    expect(secondPage.status).toBe(200);
    const secondData = secondPage.body.data as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };
    expect(secondData.items[0]?.id).toBe(middle.product.id);
    expect(secondData.items[0]?.id).not.toBe(firstData.items[0]?.id);
  });

  it("rejects malformed or sort-mismatched cursors", async () => {
    const invalid = await api().get("/api/v1/products?limit=2&cursor=not-a-cursor");
    expect(invalid.status).toBe(400);

    await createTestProduct(tracker);
    await createTestProduct(tracker);
    const firstPage = await api().get("/api/v1/products?limit=1");
    const cursor = (firstPage.body.data as { nextCursor: string }).nextCursor;
    const mismatched = await api().get(
      `/api/v1/products?limit=1&sort=price_asc&cursor=${encodeURIComponent(cursor)}`
    );
    expect(mismatched.status).toBe(400);
  });
});
