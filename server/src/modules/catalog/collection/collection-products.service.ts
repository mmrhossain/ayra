import type { CollectionSource, Prisma } from "../../../generated/prisma/client.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { encodeCursor } from "../../../common/utils/cursor.ts";
import { prisma } from "../../../lib/prisma.ts";
import type { HomeProductCard } from "../../home/types.ts";
import { z } from "zod";

const DEFAULT_LIMIT = 8;

const publishedWhere: Prisma.ProductWhereInput = {
  deletedAt: null,
  status: "ACTIVE",
};

const homeProductSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  salesCount30d: true,
  trendingScore: true,
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

export const toCard = (product: HomeProductRow): HomeProductCard => ({
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
      0
    );
    return { ...rest, availableStock };
  }),
});

const onSaleVariantWhere: Prisma.ProductVariantWhereInput = {
  deletedAt: null,
  compareAtPrice: { gt: prisma.productVariant.fields.price },
};

export const hasPublishedCollectionItems = async (collectionId: string) =>
  Boolean(await prisma.productCollectionItem.findFirst({
    where: { collectionId, product: publishedWhere },
    select: { productId: true },
  }));

export const collectionWindowWhere = (now: Date): Prisma.ProductCollectionWhereInput => ({
  AND: [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ],
});

export type ResolvedCollection = {
  id: string;
  name: string;
  slug: string;
  source: CollectionSource;
  limit: number;
};

export const homeCursorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("createdAt"),
    id: z.string().min(1),
    createdAt: z.string().datetime(),
  }),
  z.object({
    kind: z.literal("salesCount30d"),
    id: z.string().min(1),
    value: z.number().finite(),
  }),
  z.object({
    kind: z.literal("trendingScore"),
    id: z.string().min(1),
    value: z.number().finite(),
  }),
  z.object({
    kind: z.literal("manual"),
    id: z.string().min(1),
    sortOrder: z.number().int(),
  }),
]);
type HomeCursor = z.infer<typeof homeCursorSchema>;

export const DEFAULT_SECTIONS: ResolvedCollection[] = [
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

const cursorAfterPublishedProduct = (
  cursor: HomeCursor | undefined,
  sortBy: "createdAt" | "salesCount30d" | "trendingScore"
): Prisma.ProductWhereInput | undefined => {
  if (!cursor) return undefined;
  if (cursor.kind !== sortBy) {
    throw new AppError("Cursor does not match homepage section", 400);
  }
  if (sortBy === "createdAt" && cursor.kind === "createdAt") {
    const createdAt = new Date(cursor.createdAt);
    return {
      OR: [
        { createdAt: { lt: createdAt } },
        { createdAt, id: { lt: cursor.id } },
      ],
    };
  }
  if (sortBy === "salesCount30d" && cursor.kind === "salesCount30d") {
    return {
      OR: [
        { salesCount30d: { lt: cursor.value } },
        { salesCount30d: cursor.value, id: { lt: cursor.id } },
      ],
    };
  }
  if (sortBy === "trendingScore" && cursor.kind === "trendingScore") {
    return {
      OR: [
        { trendingScore: { lt: cursor.value } },
        { trendingScore: cursor.value, id: { lt: cursor.id } },
      ],
    };
  }
  throw new AppError("Cursor does not match homepage section", 400);
};

const loadPublishedPage = async (
  where: Prisma.ProductWhereInput,
  sortBy: "createdAt" | "salesCount30d" | "trendingScore",
  take: number,
  cursor?: HomeCursor
) => {
  const after = cursorAfterPublishedProduct(cursor, sortBy);
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sortBy === "createdAt"
      ? [{ createdAt: "desc" }, { id: "desc" }]
      : sortBy === "salesCount30d"
        ? [{ salesCount30d: "desc" }, { id: "desc" }]
        : [{ trendingScore: "desc" }, { id: "desc" }];
  const products = await prisma.product.findMany({
    where: {
      AND: [publishedWhere, where, ...(after ? [after] : [])],
    },
    orderBy,
    take: take + 1,
    select: homeProductSelect,
  });
  const visible = products.slice(0, take);
  const last = visible[visible.length - 1];
  const hasMore = products.length > take;
  let nextCursor: string | null = null;
  if (hasMore && last) {
    const value =
      sortBy === "createdAt"
        ? { kind: "createdAt" as const, id: last.id, createdAt: last.createdAt.toISOString() }
        : sortBy === "salesCount30d"
          ? { kind: "salesCount30d" as const, id: last.id, value: last.salesCount30d }
          : { kind: "trendingScore" as const, id: last.id, value: last.trendingScore };
    nextCursor = encodeCursor(value);
  }
  return { products: visible, nextCursor };
};

const loadManualPage = async (
  collectionId: string,
  take: number,
  cursor?: HomeCursor
) => {
  if (cursor && cursor.kind !== "manual") {
    throw new AppError("Cursor does not match homepage section", 400);
  }
  const items = await prisma.productCollectionItem.findMany({
    where: {
      collectionId,
      product: publishedWhere,
      ...(cursor
        ? {
            OR: [
              { sortOrder: { gt: cursor.sortOrder } },
              {
                sortOrder: cursor.sortOrder,
                productId: { gt: cursor.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
    take: take + 1,
    select: {
      sortOrder: true,
      productId: true,
      product: { select: homeProductSelect },
    },
  });
  const visible = items.slice(0, take);
  const last = visible[visible.length - 1];
  const nextCursor =
    items.length > take && last
      ? encodeCursor({
          kind: "manual",
          id: last.productId,
          sortOrder: last.sortOrder,
        })
      : null;
  return { products: visible.map((item) => item.product), nextCursor };
};

export const resolveProducts = async (
  collection: ResolvedCollection,
  cursor?: HomeCursor
) => {
  const take = collection.limit > 0 ? collection.limit : DEFAULT_LIMIT;

  switch (collection.source) {
    case "NEW_ARRIVALS":
      return loadPublishedPage({}, "createdAt", take, cursor);
    case "BEST_SELLERS":
      return loadPublishedPage({}, "salesCount30d", take, cursor);
    case "TRENDING":
      return loadPublishedPage({}, "trendingScore", take, cursor);
    case "DISCOUNT":
      return loadPublishedPage(
        { variants: { some: onSaleVariantWhere } },
        "createdAt",
        take,
        cursor
      );
    case "FEATURED": {
      if (!collection.id.startsWith("default-") && await hasPublishedCollectionItems(collection.id)) {
        return loadManualPage(collection.id, take, cursor);
      }
      return loadPublishedPage({ isFeatured: true }, "createdAt", take, cursor);
    }
    case "MANUAL":
      return loadManualPage(collection.id, take, cursor);
    default:
      return { products: [], nextCursor: null };
  }
};
