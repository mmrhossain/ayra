import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  getOrdersByStatusHandler,
  getOverviewHandler,
  getSalesHandler,
  getTopProductsHandler,
} from "../controllers/analytics.controller.ts";

const router = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/analytics/overview", ...adminOnly, getOverviewHandler);
router.get("/admin/analytics/sales", ...adminOnly, getSalesHandler);
router.get("/admin/analytics/top-products", ...adminOnly, getTopProductsHandler);
router.get(
  "/admin/analytics/orders-by-status",
  ...adminOnly,
  getOrdersByStatusHandler
);

export default router;
