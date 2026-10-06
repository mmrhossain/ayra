import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  getWarehouses,
  getWarehouse,
  createWarehouseHandler,
  updateWarehouseHandler,
  deleteWarehouseHandler,
} from "../controllers/warehouse.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/warehouses", ...adminOnly, getWarehouses);
router.post("/admin/warehouses", ...adminOnly, createWarehouseHandler);
router.get("/admin/warehouses/:id", ...adminOnly, getWarehouse);
router.put("/admin/warehouses/:id", ...adminOnly, updateWarehouseHandler);
router.delete("/admin/warehouses/:id", ...adminOnly, deleteWarehouseHandler);

export default router;
