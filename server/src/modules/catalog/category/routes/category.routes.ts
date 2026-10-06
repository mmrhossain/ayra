import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  createCategoryHandler,
  deleteCategoryHandler,
  getAdminCategories,
  getCategories,
  getCategory,
  updateCategoryHandler,
} from "../controllers/category.controller.ts";

const router = Router();

// Public catalog
router.get("/categories", getCategories);
router.get("/categories/:slug", getCategory);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/categories", ...adminOnly, getAdminCategories);
router.post("/admin/categories", ...adminOnly, createCategoryHandler);
router.put("/admin/categories/:id", ...adminOnly, updateCategoryHandler);
router.delete("/admin/categories/:id", ...adminOnly, deleteCategoryHandler);

export default router;
