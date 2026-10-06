import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import {
  adminListReviewsQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
  rejectReviewSchema,
  updateReviewSchema,
} from "../validators/review.validators.ts";
import {
  adminListReviews,
  approveReview,
  createReview,
  deleteReview,
  listProductReviews,
  rejectReview,
  updateReview,
} from "../services/review.service.ts";

export const createReviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = createReviewSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await createReview(
        customerProfile.id,
        requireParam(req.params.productId, "productId"),
        input
      ),
      "Review submitted for approval",
      201
    );
  }
);

export const listProductReviewsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listReviewsQuerySchema.parse(req.query);

    successResponse(
      res,
      await listProductReviews(
        requireParam(req.params.productId, "productId"),
        query
      ),
      "Reviews fetched"
    );
  }
);

export const updateReviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateReviewSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await updateReview(
        customerProfile.id,
        requireParam(req.params.id, "id"),
        input
      ),
      "Review updated"
    );
  }
);

export const deleteReviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const reviewId = requireParam(req.params.id, "id");
    const isAdmin = req.auth.user.role === "ADMIN";

    let ownerId = "";

    if (!isAdmin) {
      const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
      ownerId = customerProfile.id;
    }

    successResponse(
      res,
      await deleteReview(ownerId, reviewId, isAdmin),
      "Review deleted"
    );
  }
);

export const adminListReviewsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = adminListReviewsQuerySchema.parse(req.query);

    successResponse(res, await adminListReviews(query), "Reviews fetched");
  }
);

export const adminApproveReviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await approveReview(requireParam(req.params.id, "id")),
      "Review approved"
    );
  }
);

export const adminRejectReviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = rejectReviewSchema.parse(req.body ?? {});

    successResponse(
      res,
      await rejectReview(requireParam(req.params.id, "id"), input),
      "Review rejected"
    );
  }
);
