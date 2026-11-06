import { Router } from "express";
import {
  requireAdminAction,
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  getInventory,
  createAdjustmentHandler,
  approveAdjustmentHandler,
  getAdjustments,
  createTransferHandler,
  completeTransferHandler,
  getTransfers,
  setStockLevelsHandler,
} from "../controllers/inventory.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];
const canAdjust = [...adminOnly, requireAdminAction("inventory:adjust")];
const canApprove = [...adminOnly, requireAdminAction("inventory:approve")];

// Admin: inventory
router.get("/admin/inventory", ...adminOnly, getInventory);
// Direct stock entry is still an inventory change and is therefore gated by
// the same action as creating an adjustment.
router.put("/admin/inventory/stock", ...canAdjust, setStockLevelsHandler);
router.get("/admin/inventory/adjustments", ...adminOnly, getAdjustments);
router.post("/admin/inventory/adjustments", ...canAdjust, createAdjustmentHandler);
router.post(
  "/admin/inventory/adjustments/:id/approve",
  ...canApprove,
  approveAdjustmentHandler
);
router.get("/admin/inventory/transfers", ...adminOnly, getTransfers);
router.post("/admin/inventory/transfers", ...canAdjust, createTransferHandler);
router.post(
  "/admin/inventory/transfers/:id/complete",
  ...canApprove,
  completeTransferHandler
);

export default router;
