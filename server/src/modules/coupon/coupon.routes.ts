import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";

import {
  validateCoupon,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "./coupon.controller.ts";

const router = Router();

router.get("/coupons/validate", requireAuth, validateCoupon);

router.get("/admin/coupons", requireAuth, requireRole("ADMIN"), adminListCoupons);
router.post("/admin/coupons", requireAuth, requireRole("ADMIN"), adminCreateCoupon);
router.put("/admin/coupons/:id", requireAuth, requireRole("ADMIN"), adminUpdateCoupon);
router.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminDeleteCoupon
);

export default router;
