import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadImageFileToCloudinary = vi.fn();
const deleteCloudinaryAsset = vi.fn();
const url = vi.fn();
const mediaAsset = {
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  findMany: vi.fn(),
};

vi.mock("../../src/lib/cloudinary.ts", () => ({
  uploadImageFileToCloudinary: (...args: unknown[]) =>
    uploadImageFileToCloudinary(...args),
  deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  cloudinary: {
    url,
  },
}));

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: {
    mediaAsset,
  },
}));

vi.mock("../../src/common/utils/image-magic.ts", () => ({
  assertAllowedImageStream: vi.fn().mockResolvedValue(undefined),
}));

const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  buildImageUrl,
  buildImageUrls,
  purgeExpiredMediaAssets,
} = await import("../../src/modules/media/media.service.ts");

const file = {
  path: "/tmp/media-test.png",
  mimetype: "image/png",
  originalname: "hero.png",
  size: 128,
};

const uploadResult = (publicId: string) => ({
  public_id: publicId,
  url: `http://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
  secure_url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
});

describe("media.service", () => {
  beforeEach(() => {
    uploadImageFileToCloudinary.mockReset();
    deleteCloudinaryAsset.mockReset();
    url.mockReset();
    mediaAsset.upsert.mockReset();
    mediaAsset.deleteMany.mockReset();
    mediaAsset.updateMany.mockReset();
    mediaAsset.findMany.mockReset();
    mediaAsset.upsert.mockResolvedValue({});
    mediaAsset.deleteMany.mockResolvedValue({ count: 0 });
    url.mockImplementation(
      (publicId: string, options?: { transformation?: Array<{ width?: number }> }) => {
        const width = options?.transformation?.[0]?.width ?? 0;
        return `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
      }
    );
  });

  it("uploads a single image without eager transforms and records a pending asset", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("products/a"));

    const result = await uploadSingleImage(file, "product", "user-1");

    expect(uploadImageFileToCloudinary).toHaveBeenCalledWith(
      file.path,
      expect.objectContaining({
        folder: "products",
        transformation: [
          expect.objectContaining({
            width: 2000,
            height: 2000,
            crop: "limit",
            fetch_format: "auto",
            quality: "auto",
            flags: "strip_profile",
          }),
        ],
      })
    );
    expect(result.publicId).toBe("products/a");
    expect(result.variants).toHaveLength(2);
    expect(mediaAsset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: "products/a" },
        create: expect.objectContaining({
          status: "PENDING",
          ownerUserId: "user-1",
          type: "product",
        }),
      })
    );
  });

  it("uploads multiple product images", async () => {
    uploadImageFileToCloudinary
      .mockResolvedValueOnce(uploadResult("products/1"))
      .mockResolvedValueOnce(uploadResult("products/2"))
      .mockResolvedValueOnce(uploadResult("products/3"));

    const results = await uploadMultipleImages([file, file, file], "product", "user-1");
    expect(results).toHaveLength(3);
    expect(results[0]?.publicId).toBe("products/1");
  });

  it("destroys already uploaded files when one parallel upload fails", async () => {
    uploadImageFileToCloudinary
      .mockResolvedValueOnce(uploadResult("products/1"))
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(uploadResult("products/3"));

    await expect(
      uploadMultipleImages([file, file, file], "product", "user-1")
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("products/1");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("products/3");
  });

  it("rejects multiple upload for non-product types", async () => {
    await expect(
      uploadMultipleImages([file], "slider", "user-1")
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects more than 5 product images", async () => {
    const files = Array.from({ length: 6 }, () => file);
    await expect(
      uploadMultipleImages(files, "product", "user-1")
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("builds slider desktop and mobile on-the-fly variants", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("sliders/a"));

    const result = await uploadSingleImage(file, "slider", "user-1");

    expect(uploadImageFileToCloudinary).toHaveBeenCalledWith(
      file.path,
      expect.objectContaining({
        folder: "sliders",
      })
    );
    expect(result.variants).toHaveLength(2);
  });

  it("builds category hero desktop, hero mobile, and card on-the-fly variants", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("categories/a"));

    const result = await uploadSingleImage(file, "category", "user-1");

    expect(result.variants).toHaveLength(3);
    const urls = buildImageUrls("categories/a", "category");
    expect(urls).toHaveLength(3);
  });

  it("deletes by publicId and builds a transformation URL", async () => {
    deleteCloudinaryAsset.mockResolvedValue(undefined);
    url.mockReturnValue("https://cdn.example.com/derived.webp");

    await deleteImage("products/a");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("products/a");
    expect(mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: { publicId: "products/a" },
    });

    const built = buildImageUrl("products/a", "product");
    expect(url).toHaveBeenCalled();
    expect(built).toContain("derived.webp");
  });

  it("purges PENDING assets older than 24 hours", async () => {
    mediaAsset.findMany.mockResolvedValue([{ publicId: "products/stale" }]);
    deleteCloudinaryAsset.mockResolvedValue(undefined);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("products/stale");
    expect(mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: { publicId: "products/stale" },
    });

    const query = mediaAsset.findMany.mock.calls[0]?.[0] as {
      where: {
        OR: Array<{
          status: string;
          createdAt?: { lt: Date };
          detachedAt?: { lt: Date };
        }>;
      };
    };
    const pendingClause = query.where.OR.find(
      (clause) => clause.status === "PENDING"
    );
    expect(pendingClause?.createdAt?.lt).toBeInstanceOf(Date);
    const ageMs = Date.now() - (pendingClause?.createdAt?.lt.getTime() ?? 0);
    expect(ageMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ageMs).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it("leaves recent PENDING assets untouched", async () => {
    mediaAsset.findMany.mockResolvedValue([]);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(0);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });
});
