import type { Prisma } from "../../../generated/prisma/client.ts";
import { prisma, transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import { decodeCursor } from "../../../common/utils/cursor.ts";
import { invalidateHomeCache } from "../../home/cache.ts";
import { DEFAULT_SECTIONS, hasPublishedCollectionItems, homeCursorSchema, resolveProducts, toCard } from "./collection-products.service.ts";
import type { CreateCollection, UpdateCollection } from "./collection.validators.ts";
export function assertCollectionWindow(startsAt: Date | null, endsAt: Date | null) {
  if (startsAt && endsAt && endsAt <= startsAt) throw new AppError("End date must be after start date", 400);
}
export async function listCollections(query: {
  page: number;
  limit: number;
  search?: string | undefined;
}) {
  const where: Prisma.ProductCollectionWhereInput = query.search ? {
    OR: [{
      name: {
        contains: query.search,
        mode: "insensitive"
      }
    }, {
      slug: {
        contains: query.search,
        mode: "insensitive"
      }
    }]
  } : {};
  const [items, total] = await Promise.all([prisma.productCollection.findMany({
    where,
    orderBy: [{
      sortOrder: "asc"
    }, {
      createdAt: "desc"
    }],
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  }), prisma.productCollection.count({
    where
  })]);
  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}
export async function getAdminCollection(id: string) {
  const row = await prisma.productCollection.findUnique({
    where: {
      id
    },
    include: {
      products: {
        orderBy: [{
          sortOrder: "asc"
        }, {
          productId: "asc"
        }],
        select: {
          productId: true,
          sortOrder: true,
          product: {
            select: {
              id: true,
              name: true,
              status: true,
              deletedAt: true
            }
          }
        }
      }
    }
  });
  if (!row) throw new AppError("Collection not found", 404);
  return row;
}
export async function saveCollection(input: CreateCollection | UpdateCollection, id?: string) {
  if (!id && (!input.name || !input.slug)) throw new AppError("Name and slug are required", 400);
  try {
    const row = await transaction(async tx => {
      const existing = id ? await tx.productCollection.findUnique({
        where: {
          id
        }
      }) : null;
      if (id && !existing) throw new AppError("Collection not found", 404);
      assertCollectionWindow(input.startsAt === undefined ? existing?.startsAt ?? null : input.startsAt, input.endsAt === undefined ? existing?.endsAt ?? null : input.endsAt);
      const {
        productIds,
        ...fields
      } = input;
      if (productIds?.length) {
        const count = await tx.product.count({
          where: {
            id: {
              in: productIds
            },
            deletedAt: null
          }
        });
        if (count !== productIds.length) throw new AppError("One or more products are unavailable", 400);
      }
      const data = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
      const saved = id ? await tx.productCollection.update({
        where: {
          id
        },
        data: data as Prisma.ProductCollectionUpdateInput
      }) : await tx.productCollection.create({
        data: {
          ...data,
          name: input.name!,
          slug: input.slug!
        } as Prisma.ProductCollectionCreateInput
      });
      if (productIds !== undefined) {
        if (id) await tx.productCollectionItem.deleteMany({
          where: {
            collectionId: id
          }
        });
        if (productIds.length) await tx.productCollectionItem.createMany({
          data: productIds.map((productId, sortOrder) => ({
            collectionId: saved.id,
            productId,
            sortOrder
          }))
        });
      }
      return saved;
    });
    await invalidateHomeCache();
    return row;
  } catch (error) {
    if (isPrismaCode(error, "P2002")) throw new AppError("Collection slug already exists", 409);
    throw error;
  }
}
async function resolveActiveCollection(slug: string) {
  const fallback = DEFAULT_SECTIONS.find(section => section.id === slug);
  const row = fallback ? null : await prisma.productCollection.findUnique({ where: { slug } });
  const now = new Date();
  if (row && (!row.isActive || row.startsAt && row.startsAt > now || row.endsAt && row.endsAt < now)) throw new AppError("Collection not found", 404);
  const collection = fallback ?? row ?? DEFAULT_SECTIONS.find(section => section.slug === slug);
  if (!collection) throw new AppError("Collection not found", 404);
  return { collection, row };
}

export async function getCollectionProductScope(slug: string): Promise<Prisma.ProductWhereInput> {
  const { collection } = await resolveActiveCollection(slug);
  if (
    collection.source === "MANUAL" ||
    (collection.source === "FEATURED" && !collection.id.startsWith("default-") &&
      await hasPublishedCollectionItems(collection.id))
  ) {
    return { collectionItems: { some: { collectionId: collection.id } } };
  }
  if (collection.source === "FEATURED") return { isFeatured: true };
  if (collection.source === "DISCOUNT") {
    return { variants: { some: { deletedAt: null, compareAtPrice: { gt: prisma.productVariant.fields.price } } } };
  }
  return {};
}

export async function getCollectionPage(slug: string, cursorToken?: string) {
  const { collection, row } = await resolveActiveCollection(slug);
  const cursor = cursorToken ? decodeCursor(cursorToken, homeCursorSchema) : undefined;
  const page = await resolveProducts(collection, cursor);
  return {
    collection: {
      id: collection.id,
      name: collection.name,
      slug: row ? collection.slug : collection.id,
      description: row?.description ?? null,
      source: collection.source
    },
    items: page.products.map(toCard),
    nextCursor: page.nextCursor
  };
}
