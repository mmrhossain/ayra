import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  listAdminCategories,
  listCategories,
  updateCategory,
} from "../services/category.service.ts";
import {
  createCategorySchema,
  listAdminCategoriesQuerySchema,
  updateCategorySchema,
} from "../validators/category.validators.ts";

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listCategories(false), "Categories fetched");
  },
);

export const getAdminCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const hasListQuery =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.search !== undefined;

    if (!hasListQuery) {
      successResponse(
        res,
        await listCategories(true),
        "Admin categories fetched",
      );
      return;
    }

    const query = listAdminCategoriesQuerySchema.parse(req.query);
    successResponse(
      res,
      await listAdminCategories(query),
      "Admin categories fetched",
    );
  },
);

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  successResponse(
    res,
    await getCategoryBySlug(requireParam(req.params.slug, "slug")),
    "Category fetched",
  );
});

export const createCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createCategorySchema.parse(req.body);
    successResponse(res, await createCategory(input), "Category created", 201);
  },
);

export const updateCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateCategorySchema.parse(req.body);
    successResponse(
      res,
      await updateCategory(requireParam(req.params.id, "id"), input),
      "Category updated",
    );
  },
);

export const deleteCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteCategory(requireParam(req.params.id, "id")),
      "Category deleted",
    );
  },
);
