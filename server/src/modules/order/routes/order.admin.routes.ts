import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  adminListOrdersHandler,
  adminGetOrderHandler,
  adminUpdateOrderStatusHandler,
} from "../controllers/order.controller.ts";
import {
  adminListReturnRequestsHandler,
  adminReviewReturnRequestHandler,
} from "../controllers/return.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/orders", ...adminOnly, adminListOrdersHandler);
router.get("/admin/orders/:id", ...adminOnly, adminGetOrderHandler);
router.patch("/admin/orders/:id/status", ...adminOnly, adminUpdateOrderStatusHandler);
router.get("/admin/return-requests", ...adminOnly, adminListReturnRequestsHandler);
router.patch("/admin/return-requests/:id", ...adminOnly, adminReviewReturnRequestHandler);

export default router;
