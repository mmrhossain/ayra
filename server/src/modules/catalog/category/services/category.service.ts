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
  mobileImage: true,
  mobileImagePublicId: true,
  isActive: true,
  parentId: true,
  createdAt: true,
} as const;

const compactImageFields = (desktopImage: string | null, mobileImage: string | null) => ({
  image: desktopImage,
  ...(mobileImage ? { mobileImage } : {}),
});

const withImageVariants = (node: CategoryBranch): CategoryNode => {
  const publicId = resolveImagePublicId(node.imagePublicId, node.image);
  const variants = publicId ? buildImageUrls(publicId, "category") : [];
  const desktopImage = variants[0] ?? node.image;
  const mobileImage = node.mobileImage ?? variants[1] ?? desktopImage;
  const { mobileImage: _mobileImage, ...rest } = node;

  return {
    ...rest,
    ...compactImageFields(desktopImage, mobileImage),
    children: node.children.map(withImageVariants),
  };
};

export const parseCategoryPath = (value: string): string[] =>
  value
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment).trim();
      } catch {
        return segment.trim();
      }
    })
    .filter(Boolean);

export const resolveCategoryByPath = async (path: string, includeInactive = false) => {
  const segments = parseCategoryPath(path);
  if (!segments.length) return null;

  let parentId: string | null = null;
  let current: { id: string } | null = null;

  for (const segment of segments) {
    current = await prisma.category.findFirst({
      where: {
        slug: segment,
        parentId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: { id: true },
    });

    if (!current) return null;
    parentId = current.id;
  }

  return current;
};

const buildCategoryTree = (categories: CategoryRecord[]): CategoryBranch[] => {
  const byId = new Map<string, CategoryBranch>();

  for (const category of categories) {
    byId.set(category.id, {
      ...category,
      parentSlug: null,
      path: category.slug,
      children: [],
    });
  }

  const roots: CategoryBranch[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      const parent = byId.get(node.parentId)!;

      parent.children.push(node);
      node.parentSlug = parent.slug;
      node.path = `${parent.path}/${node.slug}`;
    } else {
      roots.push(node);
      node.parentSlug = null;
      node.path = node.slug;
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
    select: categoryFields,
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
    const desktopImage = variants[0] ?? row.image;
    const mobileImage = row.mobileImage ?? variants[1] ?? desktopImage;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imagePublicId: row.imagePublicId,
      mobileImagePublicId: row.mobileImagePublicId,
      isActive: row.isActive,
      parentId: row.parentId,
      parentName: row.parent?.name ?? null,
      childrenCount: row._count.children,
      createdAt: row.createdAt,
      ...compactImageFields(desktopImage, mobileImage),
    };
  });

  return paginated(items, query.page, query.limit, total);
};

export const getCategoryBySlug = async (slug: string, includeInactive: boolean = false) => {
  const path = parseCategoryPath(slug).join("/");
  const resolved = await resolveCategoryByPath(path, includeInactive);

  if (!resolved) {
    throw new AppError("Category not found", 404);
  }

  const category = await prisma.category.findFirst({
    where: {
      id: resolved.id,
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    select: {
      ...categoryFields,
      parent: {
        select: {
          slug: true,
        },
      },
      _count: {
        select: {
          products: {
            where: {
              deletedAt: null,
              status: "ACTIVE",
            },
          },
        },
      },
      children: {
        where: {
          deletedAt: null,
          ...(includeInactive ? {} : { isActive: true }),
        },
        select: categoryFields,
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const { _count, children, parent, ...record } = category;
  const parentSlug = parent?.slug ?? null;

  const treeNode: CategoryBranch = {
    ...record,
    parentSlug,
    path,
    children: children.map((child) => ({
      ...child,
      parentSlug: category.slug,
      path: `${path}/${child.slug}`,
      children: [],
    })),
  };

  return {
    ...withImageVariants(treeNode),
    productsCount: _count.products,
  };
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
  const variants = publicId ? buildImageUrls(publicId, "category") : [];
  const mobileImage = input.mobileImage ?? variants[1] ?? null;
  const mobileImagePublicId = resolveImagePublicId(input.mobileImagePublicId, mobileImage);

  const created = await prisma.category.create({
    data: {
      name,
      slug,
      isActive: input.isActive,
      description: input.description ?? null,
      image: input.image ?? null,
      imagePublicId: publicId,
      mobileImage,
      mobileImagePublicId,
      parentId,
    },
  });

  await attachMediaAssets([publicId, mobileImagePublicId], "category", created.id);

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

  const imageChanged =
    input.image !== undefined || input.imagePublicId !== undefined || imageCleared;
  const mobileCleared = input.mobileImage === null || input.mobileImagePublicId === null;

  let nextMobileImage = existing.mobileImage;
  let nextMobileImagePublicId = existing.mobileImagePublicId;

  if (mobileCleared) {
    nextMobileImage = null;
    nextMobileImagePublicId = null;
  } else if (input.mobileImage !== undefined || input.mobileImagePublicId !== undefined) {
    nextMobileImage =
      input.mobileImage !== undefined ? input.mobileImage : existing.mobileImage;
    nextMobileImagePublicId = resolveImagePublicId(
      input.mobileImagePublicId ?? existing.mobileImagePublicId,
      nextMobileImage
    );
  } else if (imageCleared) {
    nextMobileImage = null;
    nextMobileImagePublicId = null;
  } else if (imageChanged && nextPublicId) {
    nextMobileImage = buildImageUrls(nextPublicId, "category")[1] ?? nextMobileImage;
    nextMobileImagePublicId = nextPublicId;
  }

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

      ...((input.mobileImage !== undefined ||
        input.mobileImagePublicId !== undefined ||
        mobileCleared ||
        input.image !== undefined ||
        imageCleared) && {
        mobileImage: nextMobileImage,
        mobileImagePublicId: nextMobileImagePublicId,
      }),

      ...(input.parentId !== undefined && {
        parentId: input.parentId,
      }),
    },
  });

  const previousPublicId = resolveImagePublicId(existing.imagePublicId, existing.image);
  const stalePublicIds: string[] = [];
  if (previousPublicId && previousPublicId !== nextPublicId) {
    stalePublicIds.push(previousPublicId);
  }
  if (
    existing.mobileImagePublicId &&
    existing.mobileImagePublicId !== nextMobileImagePublicId &&
    existing.mobileImagePublicId !== previousPublicId
  ) {
    stalePublicIds.push(existing.mobileImagePublicId);
  }

  await detachMediaAssets(stalePublicIds);
  await attachMediaAssets([nextPublicId, nextMobileImagePublicId], "category", id);

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

  await detachMediaAssets([
    resolveImagePublicId(existing.imagePublicId, existing.image),
    existing.mobileImagePublicId,
  ]);

  await invalidateCatalogCache();
  return deleted;
};
