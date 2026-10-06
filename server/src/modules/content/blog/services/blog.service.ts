import { prisma } from "../../../../lib/prisma.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { isPrismaCode } from "../../../../common/utils/prisma-error.ts";
import { sanitizeHtml } from "../../../../common/utils/sanitize-html.ts";
import type { Prisma } from "../../../../generated/prisma/client.ts";
import type {
  CreateBlogCategoryInput,
  CreateBlogInput,
  ListAdminBlogsQuery,
  ListPublicBlogsQuery,
  UpdateBlogCategoryInput,
  UpdateBlogInput,
} from "../types.ts";

const publicBlogSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featuredImage: true,
  status: true,
  metaTitle: true,
  metaDescription: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

const publicListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

const adminBlogSelect = {
  ...publicBlogSelect,
  metaKeywords: true,
  categoryId: true,
  deletedAt: true,
} as const;

const publishedWhere: Prisma.BlogWhereInput = {
  deletedAt: null,
  status: "PUBLISHED",
};

export const listPublicBlogs = async (query: ListPublicBlogsQuery) => {
  const where: Prisma.BlogWhereInput = { ...publishedWhere };
  if (query.category) {
    where.category = { slug: query.category };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: query.limit,
      select: publicListSelect,
    }),
    prisma.blog.count({ where }),
  ]);

  return paginated(items, query.page, query.limit, total);
};

export const getPublicBlogBySlug = async (slug: string) => {
  const post = await prisma.blog.findFirst({
    where: { ...publishedWhere, slug },
    select: publicBlogSelect,
  });
  if (!post) throw new AppError("Blog post not found", 404);
  return { ...post, content: sanitizeHtml(post.content) };
};

export const listBlogCategories = async () => {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { blogs: { where: { deletedAt: null } } } } },
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    postCount: _count.blogs,
  }));
};

export const createBlogCategory = async (input: CreateBlogCategoryInput) => {
  try {
    return await prisma.blogCategory.create({
      data: { name: input.name, slug: input.slug },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("Blog category slug already exists", 409);
    }
    throw err;
  }
};

export const updateBlogCategory = async (
  id: string,
  input: UpdateBlogCategoryInput
) => {
  const existing = await prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError("Blog category not found", 404);

  try {
    return await prisma.blogCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
      },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("Blog category slug already exists", 409);
    }
    throw err;
  }
};

export const deleteBlogCategory = async (id: string) => {
  const existing = await prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) throw new AppError("Blog category not found", 404);

  const postCount = await prisma.blog.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (postCount > 0) {
    throw new AppError("Cannot delete blog category that still has posts", 409);
  }

  try {
    return await prisma.blogCategory.delete({ where: { id } });
  } catch (err) {
    if (isPrismaCode(err, "P2003")) {
      throw new AppError("Cannot delete blog category that still has posts", 409);
    }
    throw err;
  }
};

export const listAdminBlogs = async (query: ListAdminBlogsQuery) => {
  const where: Prisma.BlogWhereInput = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.search) {
    where.title = { contains: query.search, mode: "insensitive" };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
      select: adminBlogSelect,
    }),
    prisma.blog.count({ where }),
  ]);

  return paginated(items, query.page, query.limit, total);
};

const assertCategory = async (categoryId: string | null | undefined) => {
  if (!categoryId) return;
  const category = await prisma.blogCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new AppError("Blog category not found", 404);
};

export const createBlog = async (input: CreateBlogInput) => {
  await assertCategory(input.categoryId);

  try {
    return await prisma.blog.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        content: sanitizeHtml(input.content),
        featuredImage: input.featuredImage ?? null,
        categoryId: input.categoryId ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        metaKeywords: input.metaKeywords ?? null,
        status: "DRAFT",
      },
      select: adminBlogSelect,
    });
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("Blog slug already exists", 409);
    }
    throw err;
  }
};

export const updateBlog = async (id: string, input: UpdateBlogInput) => {
  const existing = await prisma.blog.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new AppError("Blog post not found", 404);

  if (input.categoryId !== undefined) {
    await assertCategory(input.categoryId);
  }

  const nextStatus = input.status ?? existing.status;
  const publishedAt =
    nextStatus === "PUBLISHED"
      ? existing.publishedAt ?? new Date()
      : nextStatus === "DRAFT" || nextStatus === "ARCHIVED"
        ? existing.publishedAt
        : existing.publishedAt;

  try {
    return await prisma.blog.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
        ...(input.content !== undefined && { content: sanitizeHtml(input.content) }),
        ...(input.featuredImage !== undefined && {
          featuredImage: input.featuredImage,
        }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
        ...(input.metaDescription !== undefined && {
          metaDescription: input.metaDescription,
        }),
        ...(input.metaKeywords !== undefined && {
          metaKeywords: input.metaKeywords,
        }),
        ...(input.status !== undefined && { status: input.status, publishedAt }),
      },
      select: adminBlogSelect,
    });
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("Blog slug already exists", 409);
    }
    throw err;
  }
};

export const publishBlog = async (id: string) => {
  const existing = await prisma.blog.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new AppError("Blog post not found", 404);
  if (existing.status === "PUBLISHED") {
    throw new AppError("Blog post is already published", 409);
  }

  return prisma.blog.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? new Date(),
    },
    select: adminBlogSelect,
  });
};

export const deleteBlog = async (id: string) => {
  const existing = await prisma.blog.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new AppError("Blog post not found", 404);

  return prisma.blog.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
    select: { id: true },
  });
};
