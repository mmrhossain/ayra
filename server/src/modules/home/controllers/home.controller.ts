import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { getHome } from "../services/home.service.ts";

export const getHomeHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  successResponse(res, await getHome(), "Home fetched");
});
