import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";

import {
  adminApproveReviewHandler,
  adminListReviewsHandler,
  adminRejectReviewHandler,
  createReviewHandler,
  deleteReviewHandler,
  listProductReviewsHandler,
  updateReviewHandler,
} from "../controllers/review.controller.ts";

const router = Router();

router.get("/products/:productId/reviews", listProductReviewsHandler);
router.post(
  "/products/:productId/reviews",
  requireAuth,
  createReviewHandler
);
router.patch("/reviews/:id", requireAuth, updateReviewHandler);
router.delete("/reviews/:id", requireAuth, deleteReviewHandler);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/reviews", ...adminOnly, adminListReviewsHandler);
router.patch("/admin/reviews/:id/approve", ...adminOnly, adminApproveReviewHandler);
router.patch("/admin/reviews/:id/reject", ...adminOnly, adminRejectReviewHandler);

export default router;
