import { Router } from "express";
import { requireAuth, requireRole } from "../../../../common/middleware/auth.middleware.ts";
import {
  getInventory,
  createAdjustmentHandler,
  approveAdjustmentHandler,
  getAdjustments,
  createTransferHandler,
  completeTransferHandler,
  getTransfers,
} from "../controllers/inventory.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

// Admin: inventory
router.get("/admin/inventory", ...adminOnly, getInventory);
router.get("/admin/inventory/adjustments", ...adminOnly, getAdjustments);
router.post("/admin/inventory/adjustments", ...adminOnly, createAdjustmentHandler);
router.post(
  "/admin/inventory/adjustments/:id/approve",
  ...adminOnly,
  approveAdjustmentHandler
);
router.get("/admin/inventory/transfers", ...adminOnly, getTransfers);
router.post("/admin/inventory/transfers", ...adminOnly, createTransferHandler);
router.post(
  "/admin/inventory/transfers/:id/complete",
  ...adminOnly,
  completeTransferHandler
);

export default router;
