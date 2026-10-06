import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const createFaqCategory = async (opts?: {
  isActive?: boolean;
  slug?: string;
}) => {
  const tag = randomUUID().slice(0, 8);
  const category = await prisma.faqCategory.create({
    data: {
      name: `FAQ Cat ${tag}`,
      slug: opts?.slug ?? `faq-cat-${tag}`,
      isActive: opts?.isActive ?? true,
    },
  });
  tracker.faqCategoryIds.push(category.id);
  return category;
};

const createFaqItem = async (
  categoryId: string,
  opts?: { isPublished?: boolean; question?: string }
) => {
  const tag = randomUUID().slice(0, 8);
  const item = await prisma.faqItem.create({
    data: {
      categoryId,
      question: opts?.question ?? `Question ${tag}?`,
      answer: `Answer ${tag}`,
      isPublished: opts?.isPublished ?? true,
    },
  });
  tracker.faqItemIds.push(item.id);
  return item;
};

describe("FAQ public list", () => {
  it("hides published items whose category is inactive", async () => {
    const category = await createFaqCategory({ isActive: false });
    const item = await createFaqItem(category.id, {
      isPublished: true,
      question: `Hidden inactive ${randomUUID().slice(0, 8)}`,
    });

    const res = await api().get("/api/v1/faqs");
    expect(res.status).toBe(200);
    const cats = res.body.data as Array<{
      id: string;
      items: Array<{ id: string }>;
    }>;
    expect(cats.some((c) => c.id === category.id)).toBe(false);
    expect(
      cats.some((c) => c.items.some((i) => i.id === item.id))
    ).toBe(false);
  });

  it("hides unpublished items from the public list", async () => {
    const category = await createFaqCategory({ isActive: true });
    const unpublished = await createFaqItem(category.id, {
      isPublished: false,
      question: `Unpublished ${randomUUID().slice(0, 8)}`,
    });
    const published = await createFaqItem(category.id, {
      isPublished: true,
      question: `Published ${randomUUID().slice(0, 8)}`,
    });

    const res = await api().get("/api/v1/faqs");
    expect(res.status).toBe(200);
    const cats = res.body.data as Array<{
      id: string;
      items: Array<{ id: string }>;
    }>;
    const found = cats.find((c) => c.id === category.id);
    expect(found).toBeTruthy();
    const ids = found!.items.map((i) => i.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(unpublished.id);
  });
});

describe("FAQ admin", () => {
  it("rejects deleting a category that still has items", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `fa-${Date.now()}`,
    });
    const category = await createFaqCategory();
    await createFaqItem(category.id, { isPublished: true });

    const res = await api()
      .delete(`/api/v1/admin/faq-categories/${category.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(409);
  });

  it("forbids category/item create without admin", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `fc-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const unauthCat = await api()
      .post("/api/v1/admin/faq-categories")
      .send({ name: `Cat ${tag}`, slug: `faq-unauth-${tag}` });
    expect([401, 403]).toContain(unauthCat.status);

    const customerCat = await api()
      .post("/api/v1/admin/faq-categories")
      .set("Cookie", customer.cookie)
      .send({ name: `Cat ${tag}`, slug: `faq-cust-${tag}` });
    expect(customerCat.status).toBe(403);

    const unauthItem = await api()
      .post("/api/v1/admin/faq-items")
      .send({
        categoryId: "00000000-0000-0000-0000-000000000001",
        question: "Q?",
        answer: "A",
      });
    expect([401, 403]).toContain(unauthItem.status);

    const customerItem = await api()
      .post("/api/v1/admin/faq-items")
      .set("Cookie", customer.cookie)
      .send({
        categoryId: "00000000-0000-0000-0000-000000000001",
        question: "Q?",
        answer: "A",
      });
    expect(customerItem.status).toBe(403);
  });
});
