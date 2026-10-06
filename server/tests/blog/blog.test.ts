import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const createBlogCategory = async (opts?: { slug?: string; name?: string }) => {
  const tag = randomUUID().slice(0, 8);
  const category = await prisma.blogCategory.create({
    data: {
      name: opts?.name ?? `Blog Cat ${tag}`,
      slug: opts?.slug ?? `blog-cat-${tag}`,
    },
  });
  tracker.blogCategoryIds.push(category.id);
  return category;
};

const createBlogPost = async (opts?: {
  slug?: string;
  title?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId?: string | null;
  deletedAt?: Date | null;
  publishedAt?: Date | null;
}) => {
  const tag = randomUUID().slice(0, 8);
  const status = opts?.status ?? "DRAFT";
  const post = await prisma.blog.create({
    data: {
      title: opts?.title ?? `Post ${tag}`,
      slug: opts?.slug ?? `blog-post-${tag}`,
      content: `<p>Body ${tag}</p>`,
      excerpt: `Excerpt ${tag}`,
      status,
      categoryId: opts?.categoryId ?? null,
      deletedAt: opts?.deletedAt ?? null,
      publishedAt:
        opts?.publishedAt !== undefined
          ? opts.publishedAt
          : status === "PUBLISHED"
            ? new Date()
            : null,
    },
  });
  tracker.blogIds.push(post.id);
  return post;
};

describe("Blog public", () => {
  it("lists only published, non-deleted posts", async () => {
    const published = await createBlogPost({ status: "PUBLISHED" });
    const draft = await createBlogPost({ status: "DRAFT" });
    const deleted = await createBlogPost({
      status: "PUBLISHED",
      deletedAt: new Date(),
    });

    const res = await api().get("/api/v1/blogs");
    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{ id: string }>;
    const ids = items.map((item) => item.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(draft.id);
    expect(ids).not.toContain(deleted.id);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
    });
  });

  it("returns a published post by slug and 404s drafts", async () => {
    const published = await createBlogPost({ status: "PUBLISHED" });
    const draft = await createBlogPost({ status: "DRAFT" });

    const ok = await api().get(`/api/v1/blogs/${published.slug}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.id).toBe(published.id);
    expect(ok.body.data.content).toContain("<p>");

    const hidden = await api().get(`/api/v1/blogs/${draft.slug}`);
    expect(hidden.status).toBe(404);
  });

  it("filters public list by category slug", async () => {
    const category = await createBlogCategory();
    const inCat = await createBlogPost({
      status: "PUBLISHED",
      categoryId: category.id,
    });
    const other = await createBlogPost({ status: "PUBLISHED" });

    const res = await api().get("/api/v1/blogs").query({ category: category.slug });
    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((item) => item.id);
    expect(ids).toContain(inCat.id);
    expect(ids).not.toContain(other.id);
  });
});

describe("Blog admin", () => {
  it("forbids category/post create without admin", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `bc-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const unauthCat = await api()
      .post("/api/v1/admin/blog-categories")
      .send({ name: `Cat ${tag}`, slug: `blog-unauth-${tag}` });
    expect([401, 403]).toContain(unauthCat.status);

    const customerCat = await api()
      .post("/api/v1/admin/blog-categories")
      .set("Cookie", customer.cookie)
      .send({ name: `Cat ${tag}`, slug: `blog-cust-${tag}` });
    expect(customerCat.status).toBe(403);

    const unauthPost = await api()
      .post("/api/v1/admin/blogs")
      .send({
        title: `Post ${tag}`,
        slug: `blog-unauth-post-${tag}`,
        content: "<p>Hi</p>",
      });
    expect([401, 403]).toContain(unauthPost.status);

    const customerPost = await api()
      .post("/api/v1/admin/blogs")
      .set("Cookie", customer.cookie)
      .send({
        title: `Post ${tag}`,
        slug: `blog-cust-post-${tag}`,
        content: "<p>Hi</p>",
      });
    expect(customerPost.status).toBe(403);
  });

  it("creates a draft, publishes it, and rejects a second publish", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ba-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const created = await api()
      .post("/api/v1/admin/blogs")
      .set("Cookie", admin.cookie)
      .send({
        title: `Draft ${tag}`,
        slug: `blog-draft-${tag}`,
        content: `<p>Hello ${tag}</p>`,
        excerpt: "Short",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("DRAFT");
    expect(created.body.data.publishedAt).toBeNull();
    tracker.blogIds.push(created.body.data.id);

    const published = await api()
      .post(`/api/v1/admin/blogs/${created.body.data.id}/publish`)
      .set("Cookie", admin.cookie);
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe("PUBLISHED");
    expect(published.body.data.publishedAt).toBeTruthy();

    const again = await api()
      .post(`/api/v1/admin/blogs/${created.body.data.id}/publish`)
      .set("Cookie", admin.cookie);
    expect(again.status).toBe(409);
  });

  it("returns 409 on duplicate slug", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bd-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const slug = `blog-dup-${tag}`;
    const first = await createBlogPost({ slug });

    const res = await api()
      .post("/api/v1/admin/blogs")
      .set("Cookie", admin.cookie)
      .send({
        title: `Other ${tag}`,
        slug,
        content: "<p>Other</p>",
      });
    expect(res.status).toBe(409);
    expect(first.id).toBeTruthy();
  });

  it("soft-deletes a post so it disappears from public and admin lists", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `be-${Date.now()}`,
    });
    const post = await createBlogPost({ status: "PUBLISHED" });

    const del = await api()
      .delete(`/api/v1/admin/blogs/${post.id}`)
      .set("Cookie", admin.cookie);
    expect(del.status).toBe(200);

    const publicRes = await api().get("/api/v1/blogs");
    const publicIds = (publicRes.body.data.items as Array<{ id: string }>).map(
      (item) => item.id
    );
    expect(publicIds).not.toContain(post.id);

    const adminRes = await api()
      .get("/api/v1/admin/blogs")
      .set("Cookie", admin.cookie);
    expect(adminRes.status).toBe(200);
    const adminIds = (adminRes.body.data.items as Array<{ id: string }>).map(
      (item) => item.id
    );
    expect(adminIds).not.toContain(post.id);
  });

  it("rejects deleting a category that still has posts", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bf-${Date.now()}`,
    });
    const category = await createBlogCategory();
    await createBlogPost({ categoryId: category.id, status: "DRAFT" });

    const res = await api()
      .delete(`/api/v1/admin/blog-categories/${category.id}`)
      .set("Cookie", admin.cookie);
    expect(res.status).toBe(409);
  });

  it("returns 409 on duplicate category slug", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bg-${Date.now()}`,
    });
    const existing = await createBlogCategory();

    const res = await api()
      .post("/api/v1/admin/blog-categories")
      .set("Cookie", admin.cookie)
      .send({ name: "Other", slug: existing.slug });
    expect(res.status).toBe(409);
  });
});
