import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestProduct,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("Wishlist", () => {
  it("adds an item and creates a wishlist", async () => {
    const user = await createTestUser(tracker, { suffix: `wl-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const res = await api()
      .post("/api/v1/wishlist/items")
      .set("Cookie", user.cookie)
      .send({ variantId: catalog.variant.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.wishlistId).toBeTruthy();
    expect(res.body.data.item.variantId).toBe(catalog.variant.id);

    const wishlist = await prisma.wishlist.findUnique({
      where: { customerProfileId: user.customerProfileId },
      include: { items: true },
    });
    expect(wishlist).toBeTruthy();
    expect(wishlist?.items).toHaveLength(1);
  });

  it("is idempotent when the same variant is added twice", async () => {
    const user = await createTestUser(tracker, { suffix: `wi-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const first = await api()
      .post("/api/v1/wishlist/items")
      .set("Cookie", user.cookie)
      .send({ variantId: catalog.variant.id });
    expect(first.status).toBe(201);

    const second = await api()
      .post("/api/v1/wishlist/items")
      .set("Cookie", user.cookie)
      .send({ variantId: catalog.variant.id });
    expect(second.status).toBe(201);
    expect(second.body.success).toBe(true);

    const count = await prisma.wishlistItem.count({
      where: { variantId: catalog.variant.id },
    });
    expect(count).toBe(1);
  });

  it("rejects removing another user's wishlist item", async () => {
    const owner = await createTestUser(tracker, { suffix: `wo-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `wt-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const added = await api()
      .post("/api/v1/wishlist/items")
      .set("Cookie", owner.cookie)
      .send({ variantId: catalog.variant.id });
    expect(added.status).toBe(201);

    const res = await api()
      .delete(`/api/v1/wishlist/items/${catalog.variant.id}`)
      .set("Cookie", other.cookie);

    expect(res.status).toBe(404);

    const remaining = await prisma.wishlistItem.count({
      where: { variantId: catalog.variant.id },
    });
    expect(remaining).toBe(1);
  });

  it("returns 401 without auth on wishlist endpoints", async () => {
    const getRes = await api().get("/api/v1/wishlist");
    expect(getRes.status).toBe(401);

    const postRes = await api()
      .post("/api/v1/wishlist/items")
      .send({ variantId: "00000000-0000-0000-0000-000000000001" });
    expect(postRes.status).toBe(401);

    const deleteRes = await api().delete(
      "/api/v1/wishlist/items/00000000-0000-0000-0000-000000000001"
    );
    expect(deleteRes.status).toBe(401);
  });
});
