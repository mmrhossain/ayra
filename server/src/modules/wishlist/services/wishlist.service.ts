import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import { prisma } from "../../../lib/prisma.ts";
import type { ListWishlistQuery } from "../types.ts";

const wishlistItemInclude = {
  variant: {
    select: {
      id: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      isDefault: true,
      images: {
        select: { id: true, imageUrl: true, altText: true, isPrimary: true },
      },
      product: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

export const getOrCreateWishlist = async (customerProfileId: string) => {
  return prisma.wishlist.upsert({
    where: { customerProfileId },
    update: {},
    create: { customerProfileId },
  });
};

export const getWishlist = async (customerProfileId: string) => {
  const wishlist = await prisma.wishlist.upsert({
    where: { customerProfileId },
    update: {},
    create: { customerProfileId },
    include: {
      items: {
        include: wishlistItemInclude,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return { id: wishlist.id, items: wishlist.items };
};

export const listWishlistItems = async (customerProfileId: string, query: ListWishlistQuery) => {
  const wishlist = await getOrCreateWishlist(customerProfileId);
  const where = { wishlistId: wishlist.id };

  const [items, total] = await Promise.all([
    prisma.wishlistItem.findMany({
      where,
      include: wishlistItemInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.wishlistItem.count({ where }),
  ]);

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

export const addWishlistItem = async (customerProfileId: string, variantId: string) => {
  const [variant, wishlist] = await Promise.all([
    prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null, product: { deletedAt: null } },
      select: { id: true },
    }),
    getOrCreateWishlist(customerProfileId),
  ]);

  if (!variant) throw new AppError("Variant not found", 404);

  const item = await prisma.wishlistItem.upsert({
    where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } },
    update: {},
    create: { wishlistId: wishlist.id, variantId },
    include: wishlistItemInclude,
  });

  return { wishlistId: wishlist.id, item };
};

export const removeWishlistItem = async (customerProfileId: string, variantId: string) => {
  const wishlist = await getOrCreateWishlist(customerProfileId);

  const deleted = await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, variantId },
  });

  if (deleted.count === 0) throw new AppError("Item not in wishlist", 404);

  return { removed: true };
};

export const clearWishlist = async (customerProfileId: string) => {
  const wishlist = await getOrCreateWishlist(customerProfileId);

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });

  return { cleared: true };
};

export const isInWishlist = async (customerProfileId: string, variantId: string) => {
  const item = await prisma.wishlistItem.findFirst({
    where: {
      variantId,
      wishlist: { customerProfileId },
    },
    select: { variantId: true },
  });

  return { inWishlist: Boolean(item) };
};
