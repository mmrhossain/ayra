import { AppError } from "../../../../common/errors/AppError.ts";
import { resolveImagePublicId } from "../../../../common/utils/cloudinary-public-id.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
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
  attachMediaAssets,
  buildImageUrls,
  detachMediaAssets,
} from "../../../media/media.service.ts";
import type {
  CategoryBranch,
  CategoryNode,
  CategoryRecord,
  CreateCategoryInput,
  ListAdminCategoriesQuery,
  UpdateCategoryInput,
} from "../types.ts";

const categoryFields = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  imagePublicId: true,
  isActive: true,
  parentId: true,
  createdAt: true,
} as const;

const productListSelect = {
  id: true,
  name: true,
  slug: true,
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
      price: true,
      compareAtPrice: true,
    },
    orderBy: {
      isDefault: "desc" as const,
    },
  },
} as const;

const withImageVariants = (node: CategoryBranch): CategoryNode => {
  const publicId = resolveImagePublicId(node.imagePublicId, node.image);

  const variants = publicId ? buildImageUrls(publicId, "category") : [];

  return {
    ...node,
    image: variants[0] ?? node.image,
    mobileImage: variants[1] ?? variants[0] ?? node.image,
    cardImage: variants[2] ?? variants[0] ?? node.image,
    children: node.children.map(withImageVariants),
  };
};

const buildCategoryTree = (categories: CategoryRecord[]): CategoryBranch[] => {
  const byId = new Map<string, CategoryBranch>();

  for (const category of categories) {
    byId.set(category.id, {
      ...category,
      parentSlug: null,
      children: [],
    });
  }

  const roots: CategoryBranch[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      const parent = byId.get(node.parentId)!;

      parent.children.push(node);
      node.parentSlug = parent.slug;
    } else {
      roots.push(node);
      node.parentSlug = null;
    }
  }

  const sortTree = (nodes: CategoryBranch[]) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const node of nodes) {
      sortTree(node.children);
    }
  };

  sortTree(roots);

  return roots;
};

const findCategoryBySlug = async (
  slug: string,
  parentId: string | null,
  includeInactive = false
) => {
  return prisma.category.findFirst({
    where: {
      slug,
      parentId,
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
  });
};

const validateParent = async (categoryId: string | null, parentId: string | null) => {
  if (!parentId) {
    return;
  }

  if (categoryId === parentId) {
    throw new AppError("A category cannot be its own parent", 400);
  }

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      parentId: true,
      deletedAt: true,
    },
  });

  if (!parent || parent.deletedAt) {
    throw new AppError("Parent category not found", 404);
  }

  if (!categoryId) {
    return;
  }

  let currentParentId: string | null = parentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      throw new AppError("Cannot move a category under one of its descendants", 400);
    }

    const currentParent: {
      parentId: string | null;
    } | null = await prisma.category.findUnique({
      where: {
        id: currentParentId,
      },
      select: {
        parentId: true,
      },
    });

    currentParentId = currentParent?.parentId ?? null;
  }
};

export const listCategories = async (includeInactive: boolean = false) => {
  const cacheKey = CacheKeys.categoryTree(includeInactive);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      ...categoryFields,
      products: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          name: "asc",
        },
        select: productListSelect,
      },
    },
  });

  const tree = buildCategoryTree(categories).map(withImageVariants);
  await cacheSet(cacheKey, tree, CacheTtl.category);
  return tree;
};

export const listAdminCategories = async (query: ListAdminCategoriesQuery) => {
  const search = query.search?.trim();

  const where: Prisma.CategoryWhereInput = {
    deletedAt: null,
    ...(search && {
      name: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        ...categoryFields,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    }),
    prisma.category.count({
      where,
    }),
  ]);

  const items = rows.map((row) => {
    const publicId = resolveImagePublicId(row.imagePublicId, row.image);

    const variants = publicId ? buildImageUrls(publicId, "category") : [];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: variants[0] ?? row.image,
      imagePublicId: row.imagePublicId,
      mobileImage: variants[1] ?? variants[0] ?? row.image,
      cardImage: variants[2] ?? variants[0] ?? row.image,
      isActive: row.isActive,
      parentId: row.parentId,
      parentName: row.parent?.name ?? null,
      childrenCount: row._count.children,
      createdAt: row.createdAt,
    };
  });

  return paginated(items, query.page, query.limit, total);
};

export const getCategoryBySlug = async (
  slug: string,
  parentIdOrIncludeInactive: string | null | boolean = null,
  includeInactive: boolean = false
) => {
  let parentId: string | null = null;

  if (typeof parentIdOrIncludeInactive === "boolean") {
    includeInactive = parentIdOrIncludeInactive;
  } else {
    parentId = parentIdOrIncludeInactive;
  }

  const category = await prisma.category.findFirst({
    where: {
      slug,
      parentId,
      deletedAt: null,
      ...(includeInactive
        ? {}
        : {
            isActive: true,
          }),
    },
    select: {
      ...categoryFields,
      products: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          name: "asc",
        },
        select: productListSelect,
      },
      children: {
        where: {
          deletedAt: null,
          ...(includeInactive
            ? {}
            : {
                isActive: true,
              }),
        },
        select: categoryFields,
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const treeNode: CategoryBranch = {
    ...category,
    parentSlug: null,
    children: category.children.map((child) => ({
      ...child,
      parentSlug: category.slug,
      children: [],
    })),
  };

  return withImageVariants(treeNode);
};

export const createCategory = async (input: CreateCategoryInput) => {
  const name = input.name.trim();
  const parentId = input.parentId ?? null;
  const slug = generateSlug(name, "Category name");

  await validateParent(null, parentId);

  const existing = await findCategoryBySlug(slug, parentId, true);

  if (existing) {
    throw new AppError("Category slug already exists under this parent", 409);
  }

  const publicId = resolveImagePublicId(input.imagePublicId, input.image);

  const created = await prisma.category.create({
    data: {
      name,
      slug,
      isActive: input.isActive,
      description: input.description ?? null,
      image: input.image ?? null,
      imagePublicId: publicId,
      parentId,
    },
  });

  if (publicId) {
    await attachMediaAssets([publicId], "category", created.id);
  }

  await invalidateCatalogCache();
  return created;
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError("Category not found", 404);
  }

  const nextName = input.name !== undefined ? input.name.trim() : existing.name;

  if (!nextName) {
    throw new AppError("Category name is required", 400);
  }

  const nameChanged = nextName !== existing.name;

  const nextParentId = input.parentId !== undefined ? input.parentId : existing.parentId;

  await validateParent(id, nextParentId);

  const nextSlug = nameChanged ? generateSlug(nextName, "Category name") : existing.slug;

  const slugChanged = nextSlug !== existing.slug;

  const parentChanged = nextParentId !== existing.parentId;

  if (slugChanged || parentChanged) {
    const slugTaken = await prisma.category.findFirst({
      where: {
        slug: nextSlug,
        parentId: nextParentId ?? null,
        deletedAt: null,
        id: {
          not: id,
        },
      },
    });

    if (slugTaken) {
      throw new AppError("Category slug already exists under this parent", 409);
    }
  }

  const imageCleared = input.image === null || input.imagePublicId === null;
  const nextImage = imageCleared ? null : input.image !== undefined ? input.image : existing.image;

  const nextPublicId = imageCleared
    ? null
    : input.image !== undefined || input.imagePublicId !== undefined
      ? resolveImagePublicId(input.imagePublicId ?? existing.imagePublicId, nextImage)
      : existing.imagePublicId;

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && {
        name: nextName,
      }),

      ...(slugChanged && {
        slug: nextSlug,
      }),

      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),

      ...(input.description !== undefined && {
        description: input.description,
      }),

      ...((input.image !== undefined || imageCleared) && {
        image: nextImage,
      }),

      ...((input.image !== undefined || input.imagePublicId !== undefined || imageCleared) && {
        imagePublicId: nextPublicId,
      }),

      ...(input.parentId !== undefined && {
        parentId: input.parentId,
      }),
    },
  });

  const previousPublicId = resolveImagePublicId(existing.imagePublicId, existing.image);

  if (previousPublicId && previousPublicId !== nextPublicId) {
    await detachMediaAssets([previousPublicId]);
  }

  if (nextPublicId) {
    await attachMediaAssets([nextPublicId], "category", id);
  }

  await invalidateCatalogCache();
  return updated;
};

export const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError("Category not found", 404);
  }

  const now = new Date();

  const deleted = await transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });

    await tx.category.updateMany({
      where: {
        parentId: id,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });

    return updated;
  });

  const publicId = resolveImagePublicId(existing.imagePublicId, existing.image);

  if (publicId) {
    await detachMediaAssets([publicId]);
  }

  await invalidateCatalogCache();
  return deleted;
};
