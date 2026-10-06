import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
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
      imagePublicId: input.imagePublicId ?? null,
      imageStatus: "READY",
      mobileImageUrl: input.mobileImageUrl ?? null,
      mobileImagePublicId: input.mobileImagePublicId ?? null,
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
      imagePublicId: true,
      mobileImagePublicId: true,
    },
  });

  if (!existing) throw new AppError("Slider not found", 404);

  const hasField = Object.values(input).some((field) => field !== undefined);

  if (!hasField) {
    throw new AppError("At least one field is required", 400);
  }

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
      ...(input.imageUrl !== undefined && {
        imageUrl: input.imageUrl,
        imageStatus: "READY",
      }),
      ...(input.imagePublicId !== undefined && {
        imagePublicId: input.imagePublicId ?? null,
      }),
      ...(input.mobileImageUrl !== undefined && {
        mobileImageUrl: input.mobileImageUrl ?? null,
        mobileImageStatus: input.mobileImageUrl ? "READY" : null,
      }),
      ...(input.mobileImagePublicId !== undefined && {
        mobileImagePublicId: input.mobileImagePublicId ?? null,
      }),
    },
    select: sliderSelect,
  });

  const stalePublicIds: string[] = [];
  if (
    input.imagePublicId !== undefined &&
    existing.imagePublicId &&
    existing.imagePublicId !== input.imagePublicId
  ) {
    stalePublicIds.push(existing.imagePublicId);
  }
  if (
    input.mobileImagePublicId !== undefined &&
    existing.mobileImagePublicId &&
    existing.mobileImagePublicId !== input.mobileImagePublicId
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

  const publicIds = [existing.imagePublicId, existing.mobileImagePublicId].filter(
    (value): value is string => Boolean(value)
  );

  await detachMediaAssets(publicIds);
  await invalidateHomeCache();

  return { deleted: true };
};
