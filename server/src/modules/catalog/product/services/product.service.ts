import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { sanitizeHtml } from "../../../../common/utils/sanitize-html.ts";
import { generateSlug } from "../../../../common/utils/slug.ts";
import type { Prisma } from "../../../../generated/prisma/client.ts";
import {
  CacheKeys,
  CacheTtl,
  cacheGet,
  cacheSet,
  invalidateCatalogCache,
} from "../../../../lib/cache.ts";
import { prisma, transaction } from "../../../../lib/prisma.ts";
import {
  resolveProductStatus,
  type CreateProductPayload,
  type ListProductsQuery,
  type UpdateProductPayload,
} from "../types/product.types.ts";
import { validateCreateProductPayload } from "../utils/product-validation.ts";
import { persistGeneratedVariants, resolveCreateVariants } from "./product-generator.service.ts";
import {
  attachProductMedia,
  collectVariantImagePublicIds,
  createProductImages,
  detachProductMedia,
  imagePublicIds,
  replaceImages,
  toProductImageRows,
} from "./product-image.service.ts";
import { rethrowUniqueConflict, upsertProductVariants } from "./product-variant.service.ts";

export { createVariant, deleteVariant, updateVariant } from "./product-variant.service.ts";

const formatProductStock = <
  T extends {
    variants: Array<{
      inventories?: Array<{ quantityAvailable: number }> | null;
      attributes?: unknown;
      [key: string]: unknown;
    }>;
  },
>(
  product: T
) => ({
  ...product,
  variants: product.variants.map((variant) => {
    const { inventories, ...rest } = variant;
    const availableStock = (inventories ?? []).reduce(
      (sum, row) => sum + (row.quantityAvailable || 0),
      0
    );
    return { ...rest, availableStock };
  }),
});

const publicVisibility = { status: "ACTIVE" as const, deletedAt: null };

export const listProducts = async (query: ListProductsQuery) => {
  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(query.status
      ? { status: query.status }
      : query.includeInactive
        ? {}
        : { status: "ACTIVE" }),
  };

  if (query.category) {
    // Search for the category AND its active subcategories
    const matchingCategory = await prisma.category.findFirst({
      where: { slug: query.category, deletedAt: null },
      select: {
        id: true,
        children: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (matchingCategory) {
      const categoryIds = [
        matchingCategory.id,
        ...matchingCategory.children.map((child) => child.id),
      ];

      where.categoryId = { in: categoryIds };
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

  const variantSome: Prisma.ProductVariantWhereInput = {
    deletedAt: null,
    ...(query.minPrice !== undefined && { price: { gte: query.minPrice } }),
    ...(query.maxPrice !== undefined && { price: { lte: query.maxPrice } }),
    ...(query.onSale === true && {
      compareAtPrice: { gt: prisma.productVariant.fields.price },
    }),
  };

  if (query.minPrice !== undefined || query.maxPrice !== undefined || query.onSale === true) {
    where.variants = { some: variantSome };
  }

  const productWhere = where as Prisma.ProductWhereInput;
  const skip = (query.page - 1) * query.limit;
  const take = query.limit;
  const isPriceSort = query.sort === "price_asc" || query.sort === "price_desc";

  const productListSelect = {
    id: true,
    name: true,
    slug: true,
    status: true,
    isFeatured: true,
    averageRating: true,
    reviewCount: true,
    category: { select: { id: true, name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true } },
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
        attributes: {
          select: {
            attributeValue: {
              select: {
                id: true,
                value: true,
                attributeId: true,
                attribute: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { isDefault: "desc" as const },
    },
  } as const;

  const [items, total] = isPriceSort
    ? await (async () => {
        const [ranked, count] = await Promise.all([
          prisma.productVariant.groupBy({
            by: ["productId"],
            where: { deletedAt: null, product: productWhere },
            _min: { price: true },
            orderBy: {
              _min: { price: query.sort === "price_asc" ? "asc" : "desc" },
            },
            skip,
            take,
          }),
          prisma.product.count({
            where: {
              ...productWhere,
              variants: { some: { deletedAt: null } },
            },
          }),
        ]);

        const ids = ranked.map((row) => row.productId);
        const unordered = ids.length
          ? await prisma.product.findMany({
              where: { id: { in: ids } },
              select: productListSelect,
            })
          : [];
        const byId = new Map(unordered.map((product) => [product.id, product]));
        return [
          ids.flatMap((id) => {
            const product = byId.get(id);
            return product ? [product] : [];
          }),
          count,
        ] as const;
      })()
    : await Promise.all([
        prisma.product.findMany({
          where: productWhere,
          orderBy: { createdAt: "desc" as const },
          skip,
          take,
          select: productListSelect,
        }),
        prisma.product.count({ where: productWhere }),
      ]);

  return paginated(
    items.map((product) => formatProductStock(product)),
    query.page,
    query.limit,
    total
  );
};

export const productDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  isFeatured: true,
  averageRating: true,
  reviewCount: true,
  metaTitle: true,
  metaDescription: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: {
      id: true,
      imageUrl: true,
      altText: true,
      isPrimary: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
  variants: {
    where: { deletedAt: null },
    select: {
      id: true,
      sku: true,
      barcode: true,
      price: true,
      compareAtPrice: true,
      weight: true,
      isDefault: true,
      inventories: {
        select: {
          quantityAvailable: true,
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          isPrimary: true,
        },
      },
      attributes: {
        select: {
          attributeValue: {
            select: {
              id: true,
              value: true,
              attributeId: true,
              attribute: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { isDefault: "desc" as const },
  },
} as const;

export const adminProductDetailSelect = {
  ...productDetailSelect,
  variants: {
    ...productDetailSelect.variants,
    select: {
      ...productDetailSelect.variants.select,
      costPrice: true,
    },
  },
} as const;

export const toProductDetail = (product: {
  variants: Array<{
    inventories?: Array<{ quantityAvailable: number }> | null;
    attributes?: Array<{
      attributeValue: {
        id: string;
        value: string;
        attributeId?: string;
        attribute?: { id: string; name: string };
      };
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}) => {
  const withStock = formatProductStock(product);
  return {
    ...withStock,
    variants: withStock.variants.map((variant) => ({
      ...variant,
      attributes: (variant.attributes ?? []).map((link) => ({
        attributeValue: {
          id: link.attributeValue.id,
          value: link.attributeValue.value,
          attributeId: link.attributeValue.attributeId ?? link.attributeValue.attribute?.id,
          attribute: link.attributeValue.attribute
            ? {
                id: link.attributeValue.attribute.id,
                name: link.attributeValue.attribute.name,
              }
            : undefined,
        },
      })),
    })),
  };
};

export const getProductBySlug = async (slug: string, admin = false) => {
  if (!admin) {
    const cached = await cacheGet(CacheKeys.productSlug(slug));
    if (cached) return cached;
  }

  const product = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(admin ? {} : publicVisibility),
    },
    select: productDetailSelect,
  });

  if (!product) throw new AppError("Product not found", 404);

  const detail = toProductDetail(product);
  if (!admin) {
    await cacheSet(CacheKeys.productSlug(slug), detail, CacheTtl.product);
  }
  return detail;
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: adminProductDetailSelect,
  });

  if (!product) throw new AppError("Product not found", 404);

  return toProductDetail(product);
};

export const createProduct = async (input: CreateProductPayload) => {
  validateCreateProductPayload(input);

  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category || category.deletedAt) {
    throw new AppError("Category not found", 404);
  }

  const slug = input.slug?.trim() ? input.slug : generateSlug(input.name, "Product name");

  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existing) throw new AppError("Product slug already exists", 409);

  const {
    images,
    variants: _variants,
    variantOptions: _opts,
    variantDefaults: _defaults,
    variantOverrides: _overrides,
    ...productData
  } = input;

  try {
    const created = await transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: productData.name,
          slug,
          status: resolveProductStatus(productData.status),
          isFeatured: productData.isFeatured,
          categoryId: productData.categoryId,
          brandId: productData.brandId ?? null,
          description: productData.description ? sanitizeHtml(productData.description) : null,
          sku: productData.sku ?? null,
          metaTitle: productData.metaTitle ?? null,
          metaDescription: productData.metaDescription ?? null,
        },
      });

      if (images?.length) {
        await createProductImages(tx, product.id, images);
      }

      const variants = await resolveCreateVariants(tx, input);
      await persistGeneratedVariants(tx, product.id, variants);

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: adminProductDetailSelect,
      });
    });

    const attachedIds = [
      ...imagePublicIds(images ?? []),
      ...collectVariantImagePublicIds(input.variants),
      ...collectVariantImagePublicIds(input.variantOverrides),
    ];
    await attachProductMedia(attachedIds, created.id);
    await invalidateCatalogCache({ productSlug: created.slug });
    return toProductDetail(created);
  } catch (err) {
    rethrowUniqueConflict(err, "Product slug or Variant SKU already exists");
  }
};

export const updateProduct = async (id: string, input: UpdateProductPayload) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true, sku: true } } },
  });
  if (!existing) throw new AppError("Product not found", 404);

  const { images, variants, ...productData } = input;

  const nextSlug =
    productData.slug !== undefined
      ? productData.slug
      : productData.name !== undefined && productData.name !== existing.name
        ? generateSlug(productData.name, "Product name")
        : undefined;

  let updatedProduct;
  let stalePublicIds: string[] = [];

  try {
    const result = await transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(productData.name !== undefined && { name: productData.name }),
          ...(nextSlug !== undefined && { slug: nextSlug }),
          ...(productData.status !== undefined && {
            status: resolveProductStatus(productData.status, existing.status),
          }),
          ...(productData.isFeatured !== undefined && {
            isFeatured: productData.isFeatured,
          }),
          ...(productData.categoryId !== undefined && {
            category: { connect: { id: productData.categoryId } },
          }),
          ...(productData.brandId !== undefined &&
            productData.brandId !== null && {
              brand: { connect: { id: productData.brandId } },
            }),
          ...(productData.brandId === null && { brand: { disconnect: true } }),
          ...(productData.description !== undefined && {
            description: productData.description
              ? sanitizeHtml(productData.description)
              : productData.description,
          }),
          ...(productData.sku !== undefined && { sku: productData.sku }),
          ...(productData.metaTitle !== undefined && {
            metaTitle: productData.metaTitle,
          }),
          ...(productData.metaDescription !== undefined && {
            metaDescription: productData.metaDescription,
          }),
        },
      });

      let staleIds: string[] = [];
      if (images) {
        staleIds = await replaceImages(
          tx,
          { productId: id, variantId: null },
          toProductImageRows(images, id)
        );
      }

      if (variants) {
        const upserted = await upsertProductVariants(tx, id, variants, existing.variants);
        staleIds.push(...upserted.staleIds);
      }

      const finalProduct = await tx.product.findUniqueOrThrow({
        where: { id },
        select: adminProductDetailSelect,
      });

      return { product: finalProduct, stalePublicIds: staleIds };
    });

    updatedProduct = result.product;
    stalePublicIds = result.stalePublicIds;
  } catch (err) {
    rethrowUniqueConflict(err, "Product slug or Variant SKU already exists");
  }

  if (stalePublicIds.length) {
    await detachProductMedia(stalePublicIds);
  }
  const nextIds = [...imagePublicIds(images ?? []), ...collectVariantImagePublicIds(variants)];
  await attachProductMedia(nextIds, id);
  if (!updatedProduct) throw new AppError("Product not found", 404);
  await invalidateCatalogCache({
    productSlug: updatedProduct.slug,
    previousSlug: existing.slug,
  });
  return toProductDetail(updatedProduct);
};

export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { select: { publicId: true, imageUrl: true } },
      variants: { select: { id: true, sku: true } },
    },
  });

  if (!existing) throw new AppError("Product not found", 404);

  const deleted = await prisma.product.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      variants: {
        updateMany: {
          where: { deletedAt: null },
          data: { deletedAt: new Date(), isDefault: false },
        },
      },
    },
  });

  await detachProductMedia(imagePublicIds(existing.images));
  await invalidateCatalogCache({ productSlug: existing.slug });

  return deleted;
};
