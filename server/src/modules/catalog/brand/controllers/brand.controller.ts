import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createBrandSchema,
  updateBrandSchema,
} from "../validators/brand.validators.ts";
import {
  listBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../services/brand.service.ts";

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  successResponse(res, await listBrands(), "Brands fetched");
});

export const createBrandHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createBrandSchema.parse(req.body);
    successResponse(res, await createBrand(input), "Brand created", 201);
  }
);

export const updateBrandHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateBrandSchema.parse(req.body);
    successResponse(
      res,
      await updateBrand(requireParam(req.params.id, "id"), input),
      "Brand updated"
    );
  }
);

export const deleteBrandHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteBrand(requireParam(req.params.id, "id")),
      "Brand deleted"
    );
  }
);
