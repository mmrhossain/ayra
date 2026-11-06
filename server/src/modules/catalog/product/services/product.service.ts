import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { sanitizeHtml } from "../../../../common/utils/sanitize-html.ts";
import { isPrismaCode } from "../../../../common/utils/prisma-error.ts";
import { generateSlug } from "../../../../common/utils/slug.ts";
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
import { allocateUniqueSlug } from "../utils/unique-identity.ts";
import { persistGeneratedVariants, resolveCreateVariants } from "./product-generator.service.ts";
import {
  attachProductMedia,
  createProductImages,
  detachProductMedia,
  imagePublicIds,
  replaceImages,
  toProductImageRows,
} from "./product-image.service.ts";
import { requireActiveWarehouses } from "./product-inventory.service.ts";
import { rethrowUniqueConflict, upsertProductVariants } from "./product-variant.service.ts";
import { assertCategoryAndBrand, resolveCreateSlug } from "./product-creation.service.ts";
import { buildProductWhere } from "./product-where.service.ts";

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
  const productWhere = await buildProductWhere(query);
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
                color: true,
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
          prisma.product.count({ where: productWhere }),
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
      publicId: true,
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
      attributes: {
        select: {
          attributeValue: {
            select: {
              id: true,
              value: true,
              color: true,
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
        color?: string | null;
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
          color: link.attributeValue.color ?? null,
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
      const warehouses = await requireActiveWarehouses(tx);
      const { category, brand } = await assertCategoryAndBrand(
        tx,
        productData.categoryId,
        productData.brandId,
      );
      const slug = await resolveCreateSlug(tx, input);

      const product = await tx.product.create({
        data: {
          name: productData.name,
          slug,
          status: resolveProductStatus(productData.status),
          isFeatured: productData.isFeatured,
          categoryId: productData.categoryId,
          brandId: productData.brandId ?? null,
          description: productData.description ? sanitizeHtml(productData.description) : null,
          metaTitle: productData.metaTitle ?? null,
          metaDescription: productData.metaDescription ?? null,
        },
      });

      if (images?.length) {
        await createProductImages(tx, product.id, images);
      }

      const variants = await resolveCreateVariants(tx, input, {
        categoryName: category.name,
        brandName: brand?.name ?? null,
      });
      await persistGeneratedVariants(tx, product.id, variants, warehouses);

      // Image-bookkeeping runs inside the same transaction so a rejected or
      // conflicting media claim rolls the product back instead of leaving an
      // orphaned record. Cloudinary itself is untouched here.
      await attachProductMedia(imagePublicIds(images ?? []), product.id, tx);

      // Keep the transaction short: the heavy detail projection is read after
      // commit instead of holding the transaction open for the extra joins.
      return { id: product.id, slug };
    });

    await invalidateCatalogCache({ productSlug: created.slug });
    const detail = await prisma.product.findUniqueOrThrow({
      where: { id: created.id },
      select: adminProductDetailSelect,
    });
    return toProductDetail(detail);
  } catch (err) {
    if (isPrismaCode(err, "P2003")) {
      throw new AppError("Category or brand not found", 400);
    }
    rethrowUniqueConflict(err, "Product slug or Variant SKU already exists");
  }
};

export const updateProduct = async (id: string, input: UpdateProductPayload) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    // Only live variants participate in replacement; soft-deleted ids must not
    // be resurrected or silently treated as editable. Scalar fields are loaded
    // so the upsert can skip writes for rows the payload leaves unchanged.
    include: {
      variants: {
        where: { deletedAt: null },
        select: {
          id: true,
          sku: true,
          price: true,
          barcode: true,
          compareAtPrice: true,
          costPrice: true,
          weight: true,
          isDefault: true,
        },
      },
    },
  });
  if (!existing) throw new AppError("Product not found", 404);

  const { images, variants, ...productData } = input;

  const requestedSlug =
    productData.slug !== undefined
      ? productData.slug
      : productData.name !== undefined && productData.name !== existing.name
        ? generateSlug(productData.name, "Product name")
        : undefined;
  const slugIsExplicit = productData.slug !== undefined;

  let updatedSlug = existing.slug;

  try {
    const result = await transaction(async (tx) => {
      const effectiveCategoryId = productData.categoryId ?? existing.categoryId;
      const effectiveBrandId =
        productData.brandId === undefined ? existing.brandId : productData.brandId;

      // Resolve category and brand once and reuse the result for both the
      // existence check and the SKU generation below, instead of querying them
      // twice in the same transaction.
      const catBrandProvided =
        productData.categoryId !== undefined || productData.brandId !== undefined;
      const names =
        catBrandProvided || variants
          ? await assertCategoryAndBrand(tx, effectiveCategoryId, effectiveBrandId)
          : undefined;

      let nextSlug: string | undefined;
      if (requestedSlug) {
        const taken = await allocateUniqueSlug(tx, requestedSlug, id);
        if (slugIsExplicit && taken !== requestedSlug) {
          throw new AppError("Product slug already exists", 409);
        }
        nextSlug = slugIsExplicit ? requestedSlug : taken;
      }

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
          { productId: id },
          toProductImageRows(images, id)
        );
      }

      if (variants) {
        const resolved =
          names ??
          (await assertCategoryAndBrand(tx, effectiveCategoryId, effectiveBrandId));
        await upsertProductVariants(tx, id, variants, existing.variants, {
          categoryName: resolved.category.name,
          brandName: resolved.brand?.name ?? null,
        });
      }

      // Media bookkeeping is part of the transaction: detach images removed from
      // the product, then attach the retained/added ones. Retained images keep
      // the same entity id, so they are never flagged as conflicts. Cloudinary
      // is not touched here.
      if (staleIds.length) {
        await detachProductMedia(staleIds, tx);
      }
      await attachProductMedia(imagePublicIds(images ?? []), id, tx);

      // Return only the identity fields; the full detail projection is read
      // after commit so the transaction does not wait on the heavier joins.
      return { slug: nextSlug ?? existing.slug };
    });

    updatedSlug = result.slug;
  } catch (err) {
    if (isPrismaCode(err, "P2003")) {
      throw new AppError("Category or brand not found", 400);
    }
    rethrowUniqueConflict(err, "Product slug or Variant SKU already exists");
  }

  await invalidateCatalogCache({
    productSlug: updatedSlug,
    previousSlug: existing.slug,
  });
  const updatedProduct = await prisma.product.findUniqueOrThrow({
    where: { id },
    select: adminProductDetailSelect,
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
