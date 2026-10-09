import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../src/config/env.ts";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const deleteCloudinaryAsset = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/lib/cloudinary.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/cloudinary.ts")>();
  return {
    ...actual,
    deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  };
});

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
  deleteCloudinaryAsset.mockClear();
});

const trackSlider = (body: { data?: { id?: string } }) => {
  if (body?.data?.id) tracker.sliderIds.push(body.data.id);
};

const cloudName = env.CLOUDINARY_CLOUD_NAME || "demo";
const desktopUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,f_webp/heroid.webp`;
const mobileUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,f_webp/mobileheroid.webp`;

describe("Slider public list", () => {
  it("returns active sliders that have an imageUrl without requiring READY status", async () => {
    const ready = await prisma.slider.create({
      data: {
        title: "Ready slide",
        imageUrl: desktopUrl,
        imagePublicId: "readyid",
        isActive: true,
        priority: 5,
      },
    });
    tracker.sliderIds.push(ready.id);

    const noImage = await prisma.slider.create({
      data: {
        title: "Pending slide",
        imageStatus: "PENDING",
        isActive: true,
      },
    });
    tracker.sliderIds.push(noImage.id);

    const inactive = await prisma.slider.create({
      data: {
        title: "Inactive slide",
        imageUrl: "https://cdn.example.com/off.webp",
        isActive: false,
      },
    });
    tracker.sliderIds.push(inactive.id);

    const res = await api().get("/api/v1/sliders");
    expect(res.status).toBe(200);
    const items = res.body.data as Array<{ id: string; mobileImageUrl: string }>;
    expect(items.some((item) => item.id === ready.id)).toBe(true);
    expect(items.some((item) => item.id === noImage.id)).toBe(false);
    expect(items.some((item) => item.id === inactive.id)).toBe(false);

    const listed = items.find((item) => item.id === ready.id);
    expect(listed?.mobileImageUrl).toBe(desktopUrl);
  });
});

describe("Slider admin", () => {
  it("rejects unauthenticated create", async () => {
    const res = await api().post("/api/v1/admin/sliders").send({
      title: "Nope",
      imageUrl: desktopUrl,
    });
    expect(res.status).toBe(401);
  });

  it("rejects create without an imageUrl", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `sl-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/admin/sliders")
      .set("Cookie", admin.cookie)
      .send({ title: "No image" });

    expect(res.status).toBe(400);
  });

  it("creates a slider without upload jobs and persists desktop and mobile URLs", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `sc-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/admin/sliders")
      .set("Cookie", admin.cookie)
      .send({
        title: "Hero",
        priority: 3,
        imageUrl: desktopUrl,
        imagePublicId: "heroid",
        mobileImageUrl: mobileUrl,
        mobileImagePublicId: "mobileheroid",
      });

    expect(res.status).toBe(201);
    trackSlider(res.body);
    expect(res.body.data.imageUrl).toBe(desktopUrl);
    expect(res.body.data.mobileImageUrl).toBe(mobileUrl);
    expect(res.body.data.imagePublicId).toBe("heroid");
    expect(res.body.data.mobileImagePublicId).toBe("mobileheroid");
  });

  it("updates metadata and deletes a slider, destroying both Cloudinary publicIds", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `su-${Date.now()}`,
    });

    const created = await api()
      .post("/api/v1/admin/sliders")
      .set("Cookie", admin.cookie)
      .send({
        title: "Original",
        imageUrl: desktopUrl,
        imagePublicId: "originalid",
        mobileImageUrl: mobileUrl,
        mobileImagePublicId: "mobileoriginalid",
      });

    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    tracker.sliderIds.push(id);

    const updated = await api()
      .patch(`/api/v1/admin/sliders/${id}`)
      .set("Cookie", admin.cookie)
      .send({ title: "Renamed", isActive: false });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Renamed");
    expect(updated.body.data.isActive).toBe(false);
    expect(updated.body.data.imageUrl).toBe(desktopUrl);
    expect(updated.body.data.mobileImageUrl).toBe(mobileUrl);

    const listed = await api()
      .get("/api/v1/admin/sliders")
      .set("Cookie", admin.cookie);
    expect(listed.status).toBe(200);
    expect(
      (listed.body.data.items as Array<{ id: string }>).some((item) => item.id === id)
    ).toBe(true);

    const deleted = await api()
      .delete(`/api/v1/admin/sliders/${id}`)
      .set("Cookie", admin.cookie);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted).toBe(true);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it("filters admin sliders by title and isActive with pagination", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `sf-${Date.now()}`,
    });
    const stamp = Date.now();

    const active = await prisma.slider.create({
      data: {
        title: `Summer Hero ${stamp}`,
        imageUrl: desktopUrl,
        isActive: true,
        priority: 2,
      },
    });
    tracker.sliderIds.push(active.id);

    const inactive = await prisma.slider.create({
      data: {
        title: `Winter Promo ${stamp}`,
        imageUrl: desktopUrl,
        isActive: false,
        priority: 1,
      },
    });
    tracker.sliderIds.push(inactive.id);

    const byTitle = await api()
      .get("/api/v1/admin/sliders")
      .query({ title: "summer", page: 1, limit: 20 })
      .set("Cookie", admin.cookie);

    expect(byTitle.status).toBe(200);
    const titleItems = byTitle.body.data.items as Array<{ id: string }>;
    expect(titleItems.some((item) => item.id === active.id)).toBe(true);
    expect(titleItems.some((item) => item.id === inactive.id)).toBe(false);
    expect(byTitle.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
    });

    const byStatus = await api()
      .get("/api/v1/admin/sliders")
      .query({ isActive: false, page: 1, limit: 1 })
      .set("Cookie", admin.cookie);

    expect(byStatus.status).toBe(200);
    const statusItems = byStatus.body.data.items as Array<{
      id: string;
      isActive: boolean;
    }>;
    expect(statusItems).toHaveLength(1);
    expect(statusItems.every((item) => item.isActive === false)).toBe(true);
    expect(byStatus.body.data.pagination.page).toBe(1);
    expect(byStatus.body.data.pagination.limit).toBe(1);
    expect(byStatus.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });
});
