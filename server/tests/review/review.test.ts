import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestOrder,
  createTestProduct,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const trackReview = (body: { data?: { id?: string } }) => {
  if (body?.data?.id) tracker.reviewIds.push(body.data.id);
};

const attachOrderItem = async (
  orderId: string,
  catalog: Awaited<ReturnType<typeof createTestProduct>>
) => {
  await prisma.orderItem.create({
    data: {
      orderId,
      productName: catalog.product.name,
      sku: catalog.variant.sku,
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
      variantId: catalog.variant.id,
    },
  });
};

describe("Review create", () => {
  it("rejects a second review of the same product by the same user", async () => {
    const user = await createTestUser(tracker, { suffix: `rd-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const first = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 5, comment: "Great" });
    expect(first.status).toBe(201);
    trackReview(first.body);

    const second = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 4, comment: "Again" });
    expect(second.status).toBe(409);
  });

  it("sets verifiedPurchase true for a DELIVERED order containing the product", async () => {
    const user = await createTestUser(tracker, { suffix: `rv-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "PENDING" });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "DELIVERED" },
    });
    await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 5, orderId: order.id });

    expect(res.status).toBe(201);
    trackReview(res.body);
    expect(res.body.data.verifiedPurchase).toBe(true);
  });

  it("sets verifiedPurchase false without orderId or for a non-DELIVERED order", async () => {
    const user = await createTestUser(tracker, { suffix: `ru-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `ru2-${Date.now()}` });
    const catalogA = await createTestProduct(tracker);
    const catalogB = await createTestProduct(tracker);
    const pending = await createTestOrder(tracker, other, { status: "PENDING" });
    await attachOrderItem(pending.id, catalogB);

    const noOrder = await api()
      .post(`/api/v1/products/${catalogA.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 4 });
    expect(noOrder.status).toBe(201);
    trackReview(noOrder.body);
    expect(noOrder.body.data.verifiedPurchase).toBe(false);

    const pendingReview = await api()
      .post(`/api/v1/products/${catalogB.product.id}/reviews`)
      .set("Cookie", other.cookie)
      .send({ rating: 3, orderId: pending.id });
    expect(pendingReview.status).toBe(201);
    trackReview(pendingReview.body);
    expect(pendingReview.body.data.verifiedPurchase).toBe(false);
  });
});

describe("Review moderation", () => {
  it("hides unapproved reviews from the public list", async () => {
    const user = await createTestUser(tracker, { suffix: `rh-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const created = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 5, comment: "Pending" });
    expect(created.status).toBe(201);
    trackReview(created.body);
    expect(created.body.data.isApproved ?? false).toBe(false);

    const stored = await prisma.review.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    expect(stored.isApproved).toBe(false);

    const list = await api().get(
      `/api/v1/products/${catalog.product.id}/reviews`
    );
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as Array<{ id: string }>).map((r) => r.id);
    expect(ids).not.toContain(created.body.data.id);
  });

  it("shows the review publicly after admin approval and updates averageRating", async () => {
    const user = await createTestUser(tracker, { suffix: `ra-${Date.now()}` });
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `rad-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const created = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 4, comment: "Approve me" });
    expect(created.status).toBe(201);
    trackReview(created.body);
    const reviewId = created.body.data.id as string;

    const approved = await api()
      .patch(`/api/v1/admin/reviews/${reviewId}/approve`)
      .set("Cookie", admin.cookie);
    expect(approved.status).toBe(200);

    const list = await api().get(
      `/api/v1/products/${catalog.product.id}/reviews`
    );
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toContain(reviewId);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: catalog.product.id },
    });
    expect(product.averageRating).toBe(4);
    expect(product.reviewCount).toBe(1);
  });

  it("admin can reject a review with optional reason", async () => {
    const user = await createTestUser(tracker, { suffix: `rj-${Date.now()}` });
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `rja-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const created = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", user.cookie)
      .send({ rating: 2, comment: "Reject me" });
    expect(created.status).toBe(201);
    trackReview(created.body);
    const reviewId = created.body.data.id as string;

    const rejected = await api()
      .patch(`/api/v1/admin/reviews/${reviewId}/reject`)
      .set("Cookie", admin.cookie)
      .send({ rejectionReason: "Off-topic" });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.isApproved).toBe(false);
    expect(rejected.body.data.rejectionReason).toBe("Off-topic");
  });

  it("rejects edit/delete from a non-owner", async () => {
    const owner = await createTestUser(tracker, { suffix: `ro-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `rx-${Date.now()}` });
    const catalog = await createTestProduct(tracker);

    const created = await api()
      .post(`/api/v1/products/${catalog.product.id}/reviews`)
      .set("Cookie", owner.cookie)
      .send({ rating: 5, comment: "Mine" });
    expect(created.status).toBe(201);
    trackReview(created.body);
    const reviewId = created.body.data.id as string;

    const editRes = await api()
      .patch(`/api/v1/reviews/${reviewId}`)
      .set("Cookie", other.cookie)
      .send({ comment: "Hijack" });
    expect(editRes.status).toBe(404);

    const deleteRes = await api()
      .delete(`/api/v1/reviews/${reviewId}`)
      .set("Cookie", other.cookie);
    expect(deleteRes.status).toBe(404);
  });
});
