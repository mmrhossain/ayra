import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import {
  ordersByStatusQuerySchema,
  overviewQuerySchema,
  salesQuerySchema,
  topProductsQuerySchema,
} from "../validators/analytics.validators.ts";
import {
  getOrdersByStatus,
  getOverview,
  getSales,
  getTopProducts,
} from "../services/analytics.service.ts";

export const getOverviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = overviewQuerySchema.parse(req.query);
    successResponse(res, await getOverview(query), "Analytics overview");
  }
);

export const getSalesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = salesQuerySchema.parse(req.query);
    successResponse(res, await getSales(query), "Sales trend");
  }
);

export const getTopProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = topProductsQuerySchema.parse(req.query);
    successResponse(res, await getTopProducts(query), "Top products");
  }
);

export const getOrdersByStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = ordersByStatusQuerySchema.parse(req.query);
    successResponse(res, await getOrdersByStatus(query), "Orders by status");
  }
);
