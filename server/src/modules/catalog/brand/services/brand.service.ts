import { CacheKeys, CacheTtl, cacheGet, cacheSet, invalidateCatalogCache } from "../../../../lib/cache.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import { resolveImagePublicId } from "../../../../common/utils/cloudinary-public-id.ts";
import { generateSlug } from "../../../../common/utils/slug.ts";
import {
  attachMediaAssets,
  deleteImages,
  detachMediaAssets,
} from "../../../media/media.service.ts";
import type {
  CreateBrandInput,
  UpdateBrandInput,
} from "../types.ts";

export const listBrands = async () => {
  const cached = await cacheGet(CacheKeys.brands);
  if (cached) return cached;

  const brands = await prisma.brand.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      logoPublicId: true,
      description: true,
      isActive: true,
    },
  });
  await cacheSet(CacheKeys.brands, brands, CacheTtl.brand);
  return brands;
};

export const createBrand = async (input: CreateBrandInput) => {
  const slug = input.slug?.trim()
    ? input.slug
    : generateSlug(input.name, "Brand name");

  const existing = await prisma.brand.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existing) throw new AppError("Brand slug already exists", 409);

  const created = await prisma.brand.create({
    data: {
      name: input.name,
      slug,
      isActive: input.isActive,
      logo: input.logo ?? null,
      logoPublicId: resolveImagePublicId(input.logoPublicId, input.logo),
      description: input.description ?? null,
    },
  });
  await attachMediaAssets([created.logoPublicId], "brand", created.id);
  await invalidateCatalogCache();
  return created;
};

export const updateBrand = async (id: string, input: UpdateBrandInput) => {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new AppError("Brand not found", 404);

  const nextSlug =
    input.slug !== undefined
      ? input.slug
      : input.name !== undefined && input.name !== existing.name
        ? generateSlug(input.name, "Brand name")
        : undefined;

  const nextLogo = input.logo !== undefined ? input.logo : existing.logo;
  const nextPublicId =
    input.logo !== undefined || input.logoPublicId !== undefined
      ? resolveImagePublicId(
          input.logoPublicId ?? existing.logoPublicId,
          nextLogo
        )
      : existing.logoPublicId;

  const updated = await prisma.brand.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(nextSlug !== undefined && { slug: nextSlug }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...((input.logo !== undefined || input.logoPublicId !== undefined) && {
        logoPublicId: nextPublicId,
      }),
      ...(input.description !== undefined && { description: input.description }),
    },
  });

  const previousPublicId = resolveImagePublicId(
    existing.logoPublicId,
    existing.logo
  );
  if (previousPublicId && previousPublicId !== nextPublicId) {
    await deleteImages([previousPublicId]);
  }
  await attachMediaAssets([nextPublicId], "brand", id);
  await invalidateCatalogCache();
  return updated;
};

export const deleteBrand = async (id: string) => {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new AppError("Brand not found", 404);

  const deleted = await prisma.brand.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await detachMediaAssets([
    resolveImagePublicId(existing.logoPublicId, existing.logo),
  ]);
  await invalidateCatalogCache();
  return deleted;
};
