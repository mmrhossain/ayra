import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import {
  listDivisions,
  listDistricts,
  listUnions,
  listUpazilas,
} from "../services/geography.service.ts";
import {
  listDistrictsQuerySchema,
  listUnionsQuerySchema,
  listUpazilasQuerySchema,
} from "../validators/geography.validators.ts";

export const listDivisionsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listDivisions(), "Divisions fetched");
  }
);

export const listDistrictsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listDistrictsQuerySchema.parse(req.query);
    successResponse(
      res,
      await listDistricts(query.divisionCode),
      "Districts fetched"
    );
  }
);

export const listUpazilasHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listUpazilasQuerySchema.parse(req.query);
    successResponse(
      res,
      await listUpazilas(query.districtCode),
      "Upazilas fetched"
    );
  }
);

export const listUnionsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listUnionsQuerySchema.parse(req.query);
    successResponse(res, await listUnions(query), "Unions fetched");
  }
);
