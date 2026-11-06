import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";
import {
  createShipmentHandler,
  getShipmentHandler,
  getShipmentOrderContextHandler,
  listShipmentsHandler,
  updateShipmentStatusHandler,
} from "./shipments.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/shipments", ...adminOnly, listShipmentsHandler);
router.get(
  "/admin/shipments/order-context/:reference",
  ...adminOnly,
  getShipmentOrderContextHandler,
);
router.get("/admin/shipments/:id", ...adminOnly, getShipmentHandler);
router.post("/admin/shipments", ...adminOnly, createShipmentHandler);
router.patch(
  "/admin/shipments/:id/status",
  ...adminOnly,
  updateShipmentStatusHandler,
);

export default router;
