import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import {
  getHome,
  getHomeSectionProducts,
} from "../services/home.service.ts";

const sectionProductsQuerySchema = z.object({
  cursor: z.string().min(1).max(2048).optional(),
});

export const getHomeHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  successResponse(res, await getHome(), "Home fetched");
});

export const getHomeSectionProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { cursor } = sectionProductsQuerySchema.parse(req.query);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    successResponse(
      res,
      await getHomeSectionProducts(requireParam(req.params.id, "section id"), cursor),
      "Homepage section products fetched"
    );
  }
);
