import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  updateCustomerProfileSchema,
  updateNotificationPreferencesSchema,
} from "../validators/profile.validators.ts";
import {
  getCustomerProfile,
  getNotificationPreferences,
  saveCustomerProfile,
  saveNotificationPreferences,
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

export const getNotificationPreferencesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await getNotificationPreferences(req.auth.user.id),
      "Notification preferences fetched"
    );
  }
);

export const saveNotificationPreferencesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateNotificationPreferencesSchema.parse(req.body);

    successResponse(
      res,
      await saveNotificationPreferences(req.auth.user.id, input),
      "Notification preferences saved"
    );
  }
);
