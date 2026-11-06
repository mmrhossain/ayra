import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  getBrands,
  getAdminBrands,
  createBrandHandler,
  updateBrandHandler,
  deleteBrandHandler,
} from "../controllers/brand.controller.ts";

const router = Router();

// Public catalog
router.get("/brands", getBrands);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/brands", ...adminOnly, getAdminBrands);
router.post("/admin/brands", ...adminOnly, createBrandHandler);
router.put("/admin/brands/:id", ...adminOnly, updateBrandHandler);
router.delete("/admin/brands/:id", ...adminOnly, deleteBrandHandler);

export default router;
