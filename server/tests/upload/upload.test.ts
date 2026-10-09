import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadImageFileToCloudinary = vi.fn();

vi.mock("../../src/lib/cloudinary.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/cloudinary.ts")>();
  return {
    ...actual,
    uploadImageFileToCloudinary: (...args: unknown[]) =>
      uploadImageFileToCloudinary(...args),
  };
});

const { CleanupTracker, api, createTestUser } = await import("../helpers/index.ts");

const tracker = new CleanupTracker();

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64"
);

const uploadResult = (publicId: string) => ({
  public_id: publicId,
  url: `http://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
  secure_url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
});

beforeEach(async () => {
  uploadImageFileToCloudinary.mockReset();
  await tracker.cleanup();
});

describe("Upload API auth and mime", () => {
  it("rejects unauthenticated single upload", async () => {
    const res = await api()
      .post("/api/v1/media/upload")
      .query({ type: "slider" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("rejects a customer uploading admin-only image types", async () => {
    const user = await createTestUser(tracker, { suffix: `up-cust-${Date.now()}` });

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "slider" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("rejects unsupported mime types", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-mime-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "category" })
      .attach("image", Buffer.from("not-an-image"), {
        filename: "hero.gif",
        contentType: "image/gif",
      });

    expect(res.status).toBe(400);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("rejects extension-spoofed non-image payloads", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-spoof-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "category" })
      .attach("image", Buffer.from("<?php echo 1;"), {
        filename: "hero.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });
});

describe("Upload API single", () => {
  it("uploads a single slider image and returns on-the-fly variants", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-s-${Date.now()}`,
    });
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("awxvgitg1do5vu2a2xtw"));

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "slider" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.publicId).toBe("awxvgitg1do5vu2a2xtw");
    expect(res.body.data.variants).toHaveLength(2);
    expect(uploadImageFileToCloudinary).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown type slider_mobile", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-sm-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "slider_mobile" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("returns a stable 502 envelope when Cloudinary upload fails", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-502-${Date.now()}`,
    });
    uploadImageFileToCloudinary.mockRejectedValue(new Error("ENETUNREACH sdk noise"));

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "category" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      success: false,
      message: "Cloudinary upload failed",
    });
  });

  it("returns a stable 504 envelope when Cloudinary times out", async () => {
    const { AppError } = await import("../../src/common/errors/AppError.ts");
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-504-${Date.now()}`,
    });
    uploadImageFileToCloudinary.mockRejectedValue(
      new AppError("Cloudinary upload timed out", 504)
    );

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "category" })
      .attach("image", PNG_1X1, { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(504);
    expect(res.body).toMatchObject({
      success: false,
      message: "Cloudinary upload timed out",
    });
  });

  it("allows a customer to upload a customer avatar", async () => {
    const user = await createTestUser(tracker, { suffix: `up-av-${Date.now()}` });
    uploadImageFileToCloudinary.mockResolvedValue(
      uploadResult("customeravatar1")
    );

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "customer_avatar" })
      .attach("image", PNG_1X1, { filename: "me.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.publicId).toBe("customeravatar1");
    expect(uploadImageFileToCloudinary).toHaveBeenCalledTimes(1);
  });

  it("rejects an unapproved vendor uploading a vendor avatar", async () => {
    const user = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `up-vend-unapp-${Date.now()}`,
      isApproved: false,
    });

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "vendor_avatar" })
      .attach("image", PNG_1X1, { filename: "shop.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("allows an approved vendor to upload a vendor avatar", async () => {
    const user = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `up-vend-app-${Date.now()}`,
      isApproved: true,
    });
    uploadImageFileToCloudinary.mockResolvedValue(
      uploadResult("vendoravatar1")
    );

    const res = await api()
      .post("/api/v1/media/upload")
      .set("Cookie", user.cookie)
      .query({ type: "vendor_avatar" })
      .attach("image", PNG_1X1, { filename: "shop.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.publicId).toBe("vendoravatar1");
  });
});

describe("Upload API multiple product images", () => {
  it("uploads 3 product images", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-m-${Date.now()}`,
    });
    let uploaded = 0;
    uploadImageFileToCloudinary.mockImplementation(async () => {
      uploaded += 1;
      return uploadResult(`prod${uploaded}id`);
    });

    const res = await api()
      .post("/api/v1/media/uploads")
      .set("Cookie", user.cookie)
      .query({ type: "product" })
      .attach("images", PNG_1X1, { filename: "a.png", contentType: "image/png" })
      .attach("images", PNG_1X1, { filename: "b.png", contentType: "image/png" })
      .attach("images", PNG_1X1, { filename: "c.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].publicId).toBe("prod1id");
    expect(uploadImageFileToCloudinary).toHaveBeenCalledTimes(3);
  });

  it("rejects a customer uploading product images", async () => {
    const user = await createTestUser(tracker, { suffix: `up-prod-c-${Date.now()}` });

    const res = await api()
      .post("/api/v1/media/uploads")
      .set("Cookie", user.cookie)
      .query({ type: "product" })
      .attach("images", PNG_1X1, { filename: "a.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("rejects more than 5 product images", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-max-${Date.now()}`,
    });

    let req = api()
      .post("/api/v1/media/uploads")
      .set("Cookie", user.cookie)
      .query({ type: "product" });

    for (const name of ["a", "b", "c", "d", "e", "f"]) {
      req = req.attach("images", PNG_1X1, {
        filename: `${name}.png`,
        contentType: "image/png",
      });
    }

    const res = await req;
    expect(res.status).toBe(400);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });

  it("rejects multiple upload for non-product types", async () => {
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `up-np-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/media/uploads")
      .set("Cookie", user.cookie)
      .query({ type: "slider" })
      .attach("images", PNG_1X1, { filename: "a.png", contentType: "image/png" })
      .attach("images", PNG_1X1, { filename: "b.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(uploadImageFileToCloudinary).not.toHaveBeenCalled();
  });
});

describe("Media library API", () => {
  it("rejects unauthenticated gallery list", async () => {
    const res = await api().get("/api/v1/media").query({ type: "product" });
    expect(res.status).toBe(401);
  });

  it("rejects a customer listing admin-only media", async () => {
    const user = await createTestUser(tracker, { suffix: `lib-cust-${Date.now()}` });
    const res = await api()
      .get("/api/v1/media")
      .set("Cookie", user.cookie)
      .query({ type: "product" });
    expect(res.status).toBe(403);
  });

  it("lists Cloudinary assets of the requested type and excludes other types", async () => {
    const { prisma } = await import("../../src/lib/prisma.ts");
    const { env } = await import("../../src/config/env.ts");
    const user = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `lib-ok-${Date.now()}`,
    });
    const cloudName = env.CLOUDINARY_CLOUD_NAME || "demo";
    const url = (id: string) =>
      `https://res.cloudinary.com/${cloudName}/image/upload/${id}.webp`;

    const productAsset = await prisma.mediaAsset.create({
      data: {
        publicId: `prodlib-${Date.now()}`,
        url: url("prodlib"),
        type: "product",
        status: "ATTACHED",
        ownerUserId: user.id,
      },
    });
    tracker.mediaAssetIds.push(productAsset.id);

    const sliderAsset = await prisma.mediaAsset.create({
      data: {
        publicId: `slidelib-${Date.now()}`,
        url: url("slidelib"),
        type: "slider",
        status: "ATTACHED",
        ownerUserId: user.id,
      },
    });
    tracker.mediaAssetIds.push(sliderAsset.id);

    const deletedAsset = await prisma.mediaAsset.create({
      data: {
        publicId: `softdel-${Date.now()}`,
        url: url("softdel"),
        type: "product",
        status: "SOFT_DELETED",
        ownerUserId: user.id,
        detachedAt: new Date(),
      },
    });
    tracker.mediaAssetIds.push(deletedAsset.id);

    const res = await api()
      .get("/api/v1/media")
      .set("Cookie", user.cookie)
      .query({ type: "product", page: 1, limit: 24 });

    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{ publicId: string; type: string }>;
    expect(items.some((item) => item.publicId === productAsset.publicId)).toBe(true);
    expect(items.some((item) => item.publicId === sliderAsset.publicId)).toBe(false);
    expect(items.some((item) => item.publicId === deletedAsset.publicId)).toBe(false);
    expect(items.every((item) => item.type === "product")).toBe(true);
  });
});
