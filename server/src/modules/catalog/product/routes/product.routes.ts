import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  getProducts,
  getProduct,
  adminGetProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  createVariantHandler,
  updateVariantHandler,
  deleteVariantHandler,
} from "../controllers/product.controller.ts";

const router = Router();

// Public catalog
router.get("/products", optionalAuth, getProducts);
router.get("/products/:slug", getProduct);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/products/:id", ...adminOnly, adminGetProductHandler);
router.post("/admin/products", ...adminOnly, createProductHandler);
router.put("/admin/products/:id", ...adminOnly, updateProductHandler);
router.delete("/admin/products/:id", ...adminOnly, deleteProductHandler);
router.post(
  "/admin/products/:productId/variants",
  ...adminOnly,
  createVariantHandler
);
router.put("/admin/variants/:id", ...adminOnly, updateVariantHandler);
router.delete("/admin/variants/:id", ...adminOnly, deleteVariantHandler);

export default router;
