import { Router } from "express";
import {
  requireApprovedVendor,
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  getCustomerProfileHandler,
  getVendorProfileHandler,
  saveCustomerProfileHandler,
  updateVendorProfileHandler,
} from "../controllers/profile.controller.ts";

const router = Router();

router.get("/customer/profile", requireAuth, getCustomerProfileHandler);
router.patch("/customer/profile", requireAuth, saveCustomerProfileHandler);
router.get(
  "/vendor/profile",
  requireAuth,
  requireRole("VENDOR"),
  getVendorProfileHandler
);
router.patch(
  "/vendor/profile",
  requireAuth,
  requireRole("VENDOR"),
  requireApprovedVendor,
  updateVendorProfileHandler
);

export default router;
