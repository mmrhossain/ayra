import { AppError } from "../../../common/errors/AppError.ts";
import { decodeCursor } from "../../../common/utils/cursor.ts";
import { prisma } from "../../../lib/prisma.ts";
import { listActiveSliders } from "../../slider/services/slider.service.ts";
import { invalidateHomeCache, readCachedHome, writeCachedHome } from "../cache.ts";
import type { HomeCategoryCard, HomePayload, HomeProductCard, HomeSection } from "../types.ts";
import { collectionWindowWhere, DEFAULT_SECTIONS, homeCursorSchema, resolveProducts, toCard, type ResolvedCollection } from "../../catalog/collection/collection-products.service.ts";

const CATEGORY_LIMIT = 8;

const loadHomeCollections = async (now: Date): Promise<ResolvedCollection[]> => {
  const collections = await prisma.productCollection.findMany({
    where: {
      isActive: true,
      placement: "HOME",
      ...collectionWindowWhere(now),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      source: true,
      limit: true,
    },
  });

  if (!collections.length) return DEFAULT_SECTIONS;
  return collections;
};

const loadHomeCategories = async (): Promise<HomeCategoryCard[]> => {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, isActive: true, parentId: null },
    orderBy: { createdAt: "asc" },
    take: CATEGORY_LIMIT,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      mobileImage: true,
      isActive: true,
      parentId: true,
    },
  });

  return categories.map((category) => ({
    ...category,
    parentSlug: "",
  }));
};

const buildHomePayload = async (): Promise<HomePayload> => {
  const now = new Date();
  const [sliders, categories, collections] = await Promise.all([
    listActiveSliders(),
    loadHomeCategories(),
    loadHomeCollections(now),
  ]);

  const sectionPages = await Promise.all(
    collections.map((collection) => resolveProducts(collection))
  );

  const sections: HomeSection[] = collections.flatMap((collection, index) => {
    const page = sectionPages[index];
    const products = (page?.products ?? []).map(toCard);
    if (!products.length) return [];
    return [
      {
        id: collection.id,
        type: "PRODUCT_GRID",
        title: collection.name,
        source: collection.source,
        href: "/collections/" + encodeURIComponent(collection.id.startsWith("default-") ? collection.id : collection.slug),
        products,
        nextCursor: page?.nextCursor ?? null,
      },
    ];
  });

  return { sliders, categories, sections };
};

export { invalidateHomeCache };

export const getHomeSectionProducts = async (
  sectionId: string,
  cursorToken?: string
): Promise<{ items: HomeProductCard[]; nextCursor: string | null }> => {
  const collections = await loadHomeCollections(new Date());
  const collection = collections.find((item) => item.id === sectionId);
  if (!collection) throw new AppError("Homepage section not found", 404);
  const cursor = cursorToken
    ? decodeCursor(cursorToken, homeCursorSchema)
    : undefined;
  const page = await resolveProducts(collection, cursor);
  return {
    items: page.products.map(toCard),
    nextCursor: page.nextCursor,
  };
};

export const getHome = async (): Promise<HomePayload> => {
  const cached = await readCachedHome();
  if (cached) return cached;

  const payload = await buildHomePayload();
  await writeCachedHome(payload);
  return payload;
};
