import type { Prisma } from "../../../../generated/prisma/client.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { resolveCategoryByPath } from "../../category/services/category.service.ts";
import type { ListProductsQuery } from "../types/product.types.ts";
import {
  buildAttributeFilterConditions,
  parseAttributesParam,
  parseCategoriesParam,
} from "../utils/product-filter-params.ts";

export const buildProductWhere = async (
  query: ListProductsQuery,
): Promise<Prisma.ProductWhereInput> => {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(query.status
      ? { status: query.status }
      : query.includeInactive
        ? {}
        : { status: "ACTIVE" }),
  };

  const selectedCategories = parseCategoriesParam(query.categories);
  if (selectedCategories.length > 0) {
    const matched = await prisma.category.findMany({
      where: { slug: { in: selectedCategories }, deletedAt: null },
      select: { id: true },
    });
    if (matched.length > 0) {
      where.categoryId = { in: matched.map((category) => category.id) };
    }
  } else if (query.category) {
    const matchingCategory = await resolveCategoryByPath(query.category);
    if (matchingCategory) {
      const children = await prisma.category.findMany({
        where: { parentId: matchingCategory.id, deletedAt: null },
        select: { id: true },
      });
      where.categoryId = {
        in: [matchingCategory.id, ...children.map((child) => child.id)],
      };
    } else {
      where.category = { slug: query.category, deletedAt: null };
    }
  }

  if (query.brand) {
    where.brand = { slug: query.brand, deletedAt: null };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.featured === true) {
    where.isFeatured = true;
  }

  const priceRange = {
    ...(query.minPrice !== undefined && { gte: query.minPrice }),
    ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
  };
  const variantSome: Prisma.ProductVariantWhereInput = {
    deletedAt: null,
    ...(Object.keys(priceRange).length > 0 && { price: priceRange }),
    ...(query.onSale === true && {
      compareAtPrice: { gt: prisma.productVariant.fields.price },
    }),
  };
  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.onSale === true
  ) {
    where.variants = { some: variantSome };
  }

  const attributeConditions = buildAttributeFilterConditions(
    parseAttributesParam(query.attrs),
  );
  if (attributeConditions.length > 0) {
    where.AND = attributeConditions;
  }

  return where;
};
