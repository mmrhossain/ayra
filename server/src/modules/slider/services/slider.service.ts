import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import { resolveImagePublicId } from "../../../common/utils/cloudinary-public-id.ts";
import {
  attachMediaAssets,
  detachMediaAssets,
} from "../../media/media.service.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { invalidateHomeCache } from "../../home/cache.ts";
import type {
  CreateSliderInput,
  ListSlidersQuery,
  UpdateSliderInput,
} from "../types.ts";

const sliderSelect = {
  id: true,
  title: true,
  imageUrl: true,
  imagePublicId: true,
  mobileImageUrl: true,
  mobileImagePublicId: true,
  redirectUrl: true,
  startDate: true,
  endDate: true,
  priority: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const nowWithinWindow = (): Prisma.SliderWhereInput => {
  const now = new Date();
  return {
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  };
};

const withMobileFallback = <
  T extends { imageUrl: string | null; mobileImageUrl: string | null },
>(
  slider: T
) => ({
  ...slider,
  mobileImageUrl: slider.mobileImageUrl ?? slider.imageUrl,
});

export const listActiveSliders = async () => {
  const sliders = await prisma.slider.findMany({
    where: {
      isActive: true,
      imageUrl: { not: null },
      ...nowWithinWindow(),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: sliderSelect,
  });

  return sliders.map(withMobileFallback);
};

export const listSliders = async (query: ListSlidersQuery) => {
  const title = query.title?.trim();
  const where: Prisma.SliderWhereInput = {
    ...(title && {
      title: { contains: title, mode: "insensitive" },
    }),
    ...(query.isActive !== undefined && { isActive: query.isActive }),
  };

  const items = await prisma.slider.findMany({
    where,
    select: sliderSelect,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
  const total = await prisma.slider.count({ where });

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

export const getSlider = async (id: string) => {
  const slider = await prisma.slider.findUnique({
    where: { id },
    select: sliderSelect,
  });

  if (!slider) throw new AppError("Slider not found", 404);
  return slider;
};

export const createSlider = async (input: CreateSliderInput) => {
  if (!input.imageUrl) {
    throw new AppError("Slider image is required", 400);
  }

  const created = await prisma.slider.create({
    data: {
      title: input.title,
      imageUrl: input.imageUrl,
      imagePublicId: resolveImagePublicId(input.imagePublicId, input.imageUrl),
      imageStatus: "READY",
      mobileImageUrl: input.mobileImageUrl ?? null,
      mobileImagePublicId: resolveImagePublicId(
        input.mobileImagePublicId,
        input.mobileImageUrl
      ),
      mobileImageStatus: input.mobileImageUrl ? "READY" : null,
      redirectUrl: input.redirectUrl ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      priority: input.priority,
      isActive: input.isActive ?? true,
    },
    select: sliderSelect,
  });
  await attachMediaAssets(
    [created.imagePublicId, created.mobileImagePublicId],
    "slider",
    created.id
  );
  await invalidateHomeCache();
  return created;
};

export const updateSlider = async (id: string, input: UpdateSliderInput) => {
  const existing = await prisma.slider.findUnique({
    where: { id },
    select: {
      id: true,
      imageUrl: true,
      imagePublicId: true,
      mobileImageUrl: true,
      mobileImagePublicId: true,
    },
  });

  if (!existing) throw new AppError("Slider not found", 404);

  const hasField = Object.values(input).some((field) => field !== undefined);

  if (!hasField) {
    throw new AppError("At least one field is required", 400);
  }

  const imageCleared = input.imageUrl === null || input.imagePublicId === null;
  const nextImageUrl = imageCleared
    ? null
    : input.imageUrl !== undefined
      ? input.imageUrl
      : existing.imageUrl;
  const nextImagePublicId = imageCleared
    ? null
    : input.imageUrl !== undefined || input.imagePublicId !== undefined
      ? resolveImagePublicId(
          input.imagePublicId ?? existing.imagePublicId,
          nextImageUrl
        )
      : existing.imagePublicId;

  const mobileCleared =
    input.mobileImageUrl === null || input.mobileImagePublicId === null;
  const nextMobileImageUrl = mobileCleared
    ? null
    : input.mobileImageUrl !== undefined
      ? input.mobileImageUrl
      : existing.mobileImageUrl;
  const nextMobileImagePublicId = mobileCleared
    ? null
    : input.mobileImageUrl !== undefined || input.mobileImagePublicId !== undefined
      ? resolveImagePublicId(
          input.mobileImagePublicId ?? existing.mobileImagePublicId,
          nextMobileImageUrl
        )
      : existing.mobileImagePublicId;

  const updated = await prisma.slider.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.redirectUrl !== undefined && {
        redirectUrl: input.redirectUrl ?? null,
      }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ?? null,
      }),
      ...(input.endDate !== undefined && { endDate: input.endDate ?? null }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...((input.imageUrl !== undefined ||
        input.imagePublicId !== undefined ||
        imageCleared) && {
        imageUrl: nextImageUrl,
        imagePublicId: nextImagePublicId,
        imageStatus: nextImageUrl ? "READY" : "PENDING",
      }),
      ...((input.mobileImageUrl !== undefined ||
        input.mobileImagePublicId !== undefined ||
        mobileCleared) && {
        mobileImageUrl: nextMobileImageUrl,
        mobileImagePublicId: nextMobileImagePublicId,
        mobileImageStatus: nextMobileImageUrl ? "READY" : null,
      }),
    },
    select: sliderSelect,
  });

  const stalePublicIds: string[] = [];
  if (existing.imagePublicId && existing.imagePublicId !== nextImagePublicId) {
    stalePublicIds.push(existing.imagePublicId);
  }
  if (
    existing.mobileImagePublicId &&
    existing.mobileImagePublicId !== nextMobileImagePublicId
  ) {
    stalePublicIds.push(existing.mobileImagePublicId);
  }

  await detachMediaAssets(stalePublicIds);
  await attachMediaAssets(
    [updated.imagePublicId, updated.mobileImagePublicId],
    "slider",
    updated.id
  );
  await invalidateHomeCache();

  return updated;
};

export const deleteSlider = async (id: string) => {
  const existing = await prisma.slider.findUnique({
    where: { id },
    select: {
      id: true,
      imagePublicId: true,
      mobileImagePublicId: true,
    },
  });

  if (!existing) throw new AppError("Slider not found", 404);

  await prisma.slider.delete({ where: { id } });

  await detachMediaAssets([existing.imagePublicId, existing.mobileImagePublicId]);
  await invalidateHomeCache();

  return { deleted: true };
};
