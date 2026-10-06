import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  blogIdParamSchema,
  blogSlugParamSchema,
  createBlogCategorySchema,
  createBlogSchema,
  listAdminBlogsQuerySchema,
  listPublicBlogsQuerySchema,
  updateBlogCategorySchema,
  updateBlogSchema,
} from "../validators/blog.validators.ts";
import {
  createBlog,
  createBlogCategory,
  deleteBlog,
  deleteBlogCategory,
  getPublicBlogBySlug,
  listAdminBlogs,
  listBlogCategories,
  listPublicBlogs,
  publishBlog,
  updateBlog,
  updateBlogCategory,
} from "../services/blog.service.ts";

const idFromParams = (params: Request["params"]): string =>
  blogIdParamSchema.parse(params).id;

export const getPublicBlogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listPublicBlogsQuerySchema.parse(req.query);
    successResponse(res, await listPublicBlogs(query), "Blogs fetched");
  }
);

export const getPublicBlogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = blogSlugParamSchema.parse(req.params);
    successResponse(res, await getPublicBlogBySlug(slug), "Blog fetched");
  }
);

export const adminListBlogCategoriesHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listBlogCategories(), "Blog categories fetched");
  }
);

export const adminCreateBlogCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createBlogCategorySchema.parse(req.body);
    successResponse(res, await createBlogCategory(input), "Blog category created", 201);
  }
);

export const adminUpdateBlogCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBlogCategorySchema.parse(req.body);
    successResponse(
      res,
      await updateBlogCategory(idFromParams(req.params), input),
      "Blog category updated"
    );
  }
);

export const adminDeleteBlogCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteBlogCategory(idFromParams(req.params)),
      "Blog category deleted"
    );
  }
);

export const adminListBlogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listAdminBlogsQuerySchema.parse(req.query);
    successResponse(res, await listAdminBlogs(query), "Blogs fetched");
  }
);

export const adminCreateBlogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createBlogSchema.parse(req.body);
    successResponse(res, await createBlog(input), "Blog created", 201);
  }
);

export const adminUpdateBlogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBlogSchema.parse(req.body);
    successResponse(
      res,
      await updateBlog(idFromParams(req.params), input),
      "Blog updated"
    );
  }
);

export const adminPublishBlogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await publishBlog(idFromParams(req.params)),
      "Blog published"
    );
  }
);

export const adminDeleteBlogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteBlog(idFromParams(req.params)),
      "Blog deleted"
    );
  }
);
