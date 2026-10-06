import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import {
  createReturnRequestSchema,
  listReturnRequestsQuerySchema,
  reviewReturnRequestSchema,
} from "../validators/return.validators.ts";
import {
  createReturnRequest,
  listReturnRequests,
  reviewReturnRequest,
} from "../services/return.service.ts";

export const createReturnRequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = createReturnRequestSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await createReturnRequest(
        customerProfile.id,
        requireParam(req.params.id, "id"),
        input
      ),
      "Return request created",
      201
    );
  }
);

export const adminListReturnRequestsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listReturnRequestsQuerySchema.parse(req.query);

    successResponse(
      res,
      await listReturnRequests(query),
      "Return requests fetched"
    );
  }
);

export const adminReviewReturnRequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = reviewReturnRequestSchema.parse(req.body);

    successResponse(
      res,
      await reviewReturnRequest(
        requireParam(req.params.id, "id"),
        input,
        req.auth.user.id
      ),
      "Return request updated"
    );
  }
);
