import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const deleteCloudinaryAsset = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/lib/cloudinary.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/cloudinary.ts")>();
  return {
    ...actual,
    deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  };
});

const { prisma } = await import("../../src/lib/prisma.ts");
const { env } = await import("../../src/config/env.ts");
const { CleanupTracker, api, createTestProduct, createTestUser } = await import(
  "../helpers/index.ts"
);

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
  deleteCloudinaryAsset.mockClear();
});

const cloudinaryUrl = (publicId: string) => {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || "demo";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.webp`;
};

const seedAsset = async (
  publicId: string,
  ownerUserId: string,
  type = "product"
) => {
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId },
    create: {
      publicId,
      url: cloudinaryUrl(publicId),
      type,
      status: "ATTACHED",
      ownerUserId,
    },
    update: {
      status: "ATTACHED",
      ownerUserId,
      detachedAt: null,
      type,
    },
  });
  tracker.mediaAssetIds.push(asset.id);
  return asset;
};

describe("Product image Cloudinary cleanup", () => {
  it("soft-deletes replaced product images after the update transaction commits", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-up-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("oldid", admin.id);
    await seedAsset("newid", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("oldid"),
        publicId: "oldid",
        isPrimary: true,
        sortOrder: 0,
      },
    });

    const res = await api()
      .put(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie)
      .send({
        images: [
          {
            imageUrl: cloudinaryUrl("newid"),
            publicId: "newid",
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].publicId).toBe("newid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();

    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "oldid" },
    });
    const newAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "newid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
    expect(newAsset?.status).toBe("ATTACHED");
  });

  it("soft-deletes product images after soft-delete", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-del-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("goneid", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("goneid"),
        publicId: "goneid",
        isPrimary: true,
      },
    });

    const res = await api()
      .delete(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const asset = await prisma.mediaAsset.findUnique({
      where: { publicId: "goneid" },
    });
    expect(asset?.status).toBe("ATTACHED");
  });
});

describe("Category image Cloudinary cleanup", () => {
  it("soft-deletes the previous category image on replace", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cimg-up-${Date.now()}`,
    });
    await seedAsset("catoldid", admin.id);
    await seedAsset("catnewid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
        image: cloudinaryUrl("catoldid"),
        imagePublicId: "catoldid",
      },
    });
    tracker.categoryIds.push(category.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${category.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: cloudinaryUrl("catnewid"),
        imagePublicId: "catnewid",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.imagePublicId).toBe("catnewid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "catoldid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
  });

  it("clears the category image when edit sends a null image", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cimg-rm-${Date.now()}`,
    });
    await seedAsset("catremoveid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
        image: cloudinaryUrl("catremoveid"),
        imagePublicId: "catremoveid",
      },
    });
    tracker.categoryIds.push(category.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${category.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: null,
        imagePublicId: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.image).toBeNull();
    expect(res.body.data.imagePublicId).toBeNull();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "catremoveid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
  });
});

describe("Blog featured image Cloudinary cleanup", () => {
  it("soft-deletes the previous blog image on replace", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bimg-up-${Date.now()}`,
    });
    await seedAsset("blogoldid", admin.id);
    await seedAsset("blognewid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const post = await prisma.blog.create({
      data: {
        title: `Post ${tag}`,
        slug: `blog-${tag}`,
        content: `<p>${tag}</p>`,
        featuredImage: cloudinaryUrl("blogoldid"),
        featuredImagePublicId: "blogoldid",
      },
    });
    tracker.blogIds.push(post.id);

    const res = await api()
      .put(`/api/v1/admin/blogs/${post.id}`)
      .set("Cookie", admin.cookie)
      .send({
        featuredImage: cloudinaryUrl("blognewid"),
        featuredImagePublicId: "blognewid",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.featuredImagePublicId).toBe("blognewid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "blogoldid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
  });

  it("clears the blog image when edit sends a null featured image", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bimg-rm-${Date.now()}`,
    });
    await seedAsset("blogremoveid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const post = await prisma.blog.create({
      data: {
        title: `Post ${tag}`,
        slug: `blog-rm-${tag}`,
        content: `<p>${tag}</p>`,
        featuredImage: cloudinaryUrl("blogremoveid"),
        featuredImagePublicId: "blogremoveid",
      },
    });
    tracker.blogIds.push(post.id);

    const res = await api()
      .put(`/api/v1/admin/blogs/${post.id}`)
      .set("Cookie", admin.cookie)
      .send({
        featuredImage: null,
        featuredImagePublicId: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.featuredImage).toBeNull();
    expect(res.body.data.featuredImagePublicId).toBeNull();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "blogremoveid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
  });
});

describe("Variant image Cloudinary cleanup", () => {
  it("soft-deletes replaced variant images after the update transaction commits", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `vimg-up-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("variantoldid", admin.id);
    await seedAsset("variantnewid", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        variantId: catalog.variant.id,
        imageUrl: cloudinaryUrl("variantoldid"),
        publicId: "variantoldid",
        isPrimary: true,
      },
    });

    const res = await api()
      .put(`/api/v1/admin/variants/${catalog.variant.id}`)
      .set("Cookie", admin.cookie)
      .send({
        images: [
          {
            imageUrl: cloudinaryUrl("variantnewid"),
            publicId: "variantnewid",
            isPrimary: true,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "variantoldid" },
    });
    expect(oldAsset?.status).toBe("ATTACHED");
  });
});

describe("Media library reuse", () => {
  it("keeps a Cloudinary file in the library when another category still uses it", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `reuse-${Date.now()}`,
    });
    await seedAsset("sharedcatid", admin.id, "category");
    await seedAsset("replacementcatid", admin.id, "category");
    const tag = randomUUID().slice(0, 8);
    const first = await prisma.category.create({
      data: {
        name: `Cat A ${tag}`,
        slug: `cat-a-${tag}`,
        isActive: true,
        image: cloudinaryUrl("sharedcatid"),
        imagePublicId: "sharedcatid",
      },
    });
    const second = await prisma.category.create({
      data: {
        name: `Cat B ${tag}`,
        slug: `cat-b-${tag}`,
        isActive: true,
        image: cloudinaryUrl("sharedcatid"),
        imagePublicId: "sharedcatid",
      },
    });
    tracker.categoryIds.push(first.id, second.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${first.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: cloudinaryUrl("replacementcatid"),
        imagePublicId: "replacementcatid",
      });

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const shared = await prisma.mediaAsset.findUnique({
      where: { publicId: "sharedcatid" },
    });
    expect(shared?.status).toBe("ATTACHED");
    const stillUsed = await prisma.category.findUnique({
      where: { id: second.id },
      select: { imagePublicId: true },
    });
    expect(stillUsed?.imagePublicId).toBe("sharedcatid");
  });
});

describe("Vendor logo Cloudinary cleanup", () => {
  it("destroys the previous vendor logo on replace", async () => {
    const user = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `vlogo-${Date.now()}`,
    });
    await seedAsset("vendoroldid", user.id);
    await seedAsset("vendornewid", user.id);

    await prisma.vendorProfile.update({
      where: { userId: user.id },
      data: {
        logo: cloudinaryUrl("vendoroldid"),
        logoPublicId: "vendoroldid",
      },
    });

    const res = await api()
      .patch("/api/v1/vendor/profile")
      .set("Cookie", user.cookie)
      .send({
        logo: cloudinaryUrl("vendornewid"),
        logoPublicId: "vendornewid",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.logoPublicId).toBe("vendornewid");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("vendoroldid");
  });
});
