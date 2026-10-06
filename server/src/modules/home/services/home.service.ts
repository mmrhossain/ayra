import type { CollectionSource, Prisma } from "../../../generated/prisma/client.ts";
import { prisma } from "../../../lib/prisma.ts";
import { listActiveSliders } from "../../slider/services/slider.service.ts";
import {
  invalidateHomeCache,
  readCachedHome,
  writeCachedHome,
} from "../cache.ts";
import type { HomeCategoryCard, HomePayload, HomeProductCard, HomeSection } from "../types.ts";

const DEFAULT_LIMIT = 8;
const CATEGORY_LIMIT = 8;

const publishedWhere: Prisma.ProductWhereInput = {
  deletedAt: null,
  status: "ACTIVE",
};

const homeProductSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  isFeatured: true,
  averageRating: true,
  reviewCount: true,
  images: {
    where: { isPrimary: true },
    select: { imageUrl: true },
    take: 1,
  },
  variants: {
    where: { deletedAt: null },
    select: {
      id: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      isDefault: true,
      inventories: { select: { quantityAvailable: true } },
    },
    orderBy: { isDefault: "desc" as const },
  },
} as const;

type HomeProductRow = Prisma.ProductGetPayload<{ select: typeof homeProductSelect }>;

const toCard = (product: HomeProductRow): HomeProductCard => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  status: product.status,
  isFeatured: product.isFeatured,
  averageRating: product.averageRating,
  reviewCount: product.reviewCount,
  images: product.images,
  variants: product.variants.map((variant) => {
    const { inventories, ...rest } = variant;
    const availableStock = (inventories ?? []).reduce(
      (sum, row) => sum + (row.quantityAvailable || 0),
      0,
    );
    return { ...rest, availableStock };
  }),
});

const onSaleVariantWhere: Prisma.ProductVariantWhereInput = {
  deletedAt: null,
  compareAtPrice: { gt: prisma.productVariant.fields.price },
};

const collectionWindowWhere = (now: Date): Prisma.ProductCollectionWhereInput => ({
  AND: [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ],
});

type ResolvedCollection = {
  id: string;
  name: string;
  slug: string;
  source: CollectionSource;
  limit: number;
};

const DEFAULT_SECTIONS: ResolvedCollection[] = [
  {
    id: "default-new-arrivals",
    name: "New Arrivals",
    slug: "new-arrivals",
    source: "NEW_ARRIVALS",
    limit: DEFAULT_LIMIT,
  },
  {
    id: "default-featured",
    name: "Featured Products",
    slug: "featured",
    source: "FEATURED",
    limit: DEFAULT_LIMIT,
  },
  {
    id: "default-discount",
    name: "Discount Products",
    slug: "discount",
    source: "DISCOUNT",
    limit: DEFAULT_LIMIT,
  },
];

const findPublished = async (
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  take: number,
) =>
  prisma.product.findMany({
    where: { ...publishedWhere, ...where },
    orderBy,
    take,
    select: homeProductSelect,
  });

const loadManualProducts = async (collectionId: string, take: number) => {
  const items = await prisma.productCollectionItem.findMany({
    where: {
      collectionId,
      product: publishedWhere,
    },
    orderBy: { sortOrder: "asc" },
    take,
    select: {
      product: { select: homeProductSelect },
    },
  });
  return items.map((item) => item.product);
};

const resolveProducts = async (
  collection: ResolvedCollection,
): Promise<HomeProductRow[]> => {
  const take = collection.limit > 0 ? collection.limit : DEFAULT_LIMIT;

  switch (collection.source) {
    case "NEW_ARRIVALS":
      return findPublished({}, { createdAt: "desc" }, take);
    case "BEST_SELLERS":
      return findPublished({}, { salesCount30d: "desc" }, take);
    case "TRENDING":
      return findPublished({}, { trendingScore: "desc" }, take);
    case "DISCOUNT":
      return findPublished(
        { variants: { some: onSaleVariantWhere } },
        { createdAt: "desc" },
        take,
      );
    case "FEATURED": {
      if (!collection.id.startsWith("default-")) {
        const curated = await loadManualProducts(collection.id, take);
        if (curated.length) return curated;
      }
      return findPublished({ isFeatured: true }, { createdAt: "desc" }, take);
    }
    case "MANUAL":
      return loadManualProducts(collection.id, take);
    default:
      return [];
  }
};

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

  const sectionProducts = await Promise.all(
    collections.map((collection) => resolveProducts(collection)),
  );

  const sections: HomeSection[] = collections.flatMap((collection, index) => {
    const products = (sectionProducts[index] ?? []).map(toCard);
    if (!products.length) return [];
    return [
      {
        id: collection.id,
        type: "PRODUCT_GRID",
        title: collection.name,
        source: collection.source,
        href: "/shop",
        products,
      },
    ];
  });

  return { sliders, categories, sections };
};

export { invalidateHomeCache };

export const getHome = async (): Promise<HomePayload> => {
  const cached = await readCachedHome();
  if (cached) return cached;

  const payload = await buildHomePayload();
  await writeCachedHome(payload);
  return payload;
};
