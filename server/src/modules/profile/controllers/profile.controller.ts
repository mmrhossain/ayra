import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  updateCustomerProfileSchema,
  updateVendorProfileSchema,
} from "../validators/profile.validators.ts";
import {
  getCustomerProfile,
  getVendorProfile,
  saveCustomerProfile,
  updateVendorProfile,
} from "../services/profile.service.ts";

export const getCustomerProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await getCustomerProfile(req.auth.user.id),
      "Customer profile fetched"
    );
  }
);

export const saveCustomerProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateCustomerProfileSchema.parse(req.body);

    successResponse(
      res,
      await saveCustomerProfile(req.auth.user.id, input),
      "Customer profile saved"
    );
  }
);

export const updateCustomerProfileHandler = saveCustomerProfileHandler;

export const getVendorProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await getVendorProfile(req.auth.user.id),
      "Vendor profile fetched"
    );
  }
);

export const updateVendorProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateVendorProfileSchema.parse(req.body);

    successResponse(
      res,
      await updateVendorProfile(req.auth.user.id, input),
      "Vendor profile updated"
    );
  }
);
