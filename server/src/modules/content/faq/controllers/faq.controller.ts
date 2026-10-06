import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createFaqCategorySchema,
  createFaqItemSchema,
  faqIdParamSchema,
  listFaqItemsQuerySchema,
  updateFaqCategorySchema,
  updateFaqItemSchema,
} from "../validators/faq.validators.ts";
import {
  createFaqCategory,
  createFaqItem,
  deleteFaqCategory,
  deleteFaqItem,
  getPublicFaqs,
  listFaqCategories,
  listFaqItems,
  updateFaqCategory,
  updateFaqItem,
} from "../services/faq.service.ts";

const idFromParams = (params: Request["params"]): string =>
  faqIdParamSchema.parse(params).id;

export const getFaqsHandler = asyncHandler(async (_req: Request, res: Response) => {
  successResponse(res, await getPublicFaqs(), "FAQs fetched");
});

export const adminListFaqCategoriesHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listFaqCategories(), "FAQ categories fetched");
  }
);

export const adminCreateFaqCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createFaqCategorySchema.parse(req.body);
    successResponse(res, await createFaqCategory(input), "FAQ category created", 201);
  }
);

export const adminUpdateFaqCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateFaqCategorySchema.parse(req.body);
    successResponse(
      res,
      await updateFaqCategory(idFromParams(req.params), input),
      "FAQ category updated"
    );
  }
);

export const adminDeleteFaqCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteFaqCategory(idFromParams(req.params)),
      "FAQ category deleted"
    );
  }
);

export const adminListFaqItemsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listFaqItemsQuerySchema.parse(req.query);
    successResponse(res, await listFaqItems(query.categoryId), "FAQ items fetched");
  }
);

export const adminCreateFaqItemHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createFaqItemSchema.parse(req.body);
    successResponse(res, await createFaqItem(input), "FAQ item created", 201);
  }
);

export const adminUpdateFaqItemHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateFaqItemSchema.parse(req.body);
    successResponse(
      res,
      await updateFaqItem(idFromParams(req.params), input),
      "FAQ item updated"
    );
  }
);

export const adminDeleteFaqItemHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteFaqItem(idFromParams(req.params)),
      "FAQ item deleted"
    );
  }
);
