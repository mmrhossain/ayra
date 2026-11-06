import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import { idempotency } from "../../../../common/middleware/idempotency.middleware.ts";
import {
  getProducts,
  getProductFacetsHandler,
  getProduct,
  adminGetProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  bulkUpdateProductsHandler,
  createVariantHandler,
  updateVariantHandler,
  deleteVariantHandler,
} from "../controllers/product.controller.ts";

const router = Router();

// Public catalog
router.get("/products", optionalAuth, getProducts);
router.get("/products/facets", optionalAuth, getProductFacetsHandler);
router.get("/products/:slug", getProduct);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/products/:id", ...adminOnly, adminGetProductHandler);
router.patch(
  "/admin/products/bulk",
  ...adminOnly,
  idempotency("product-bulk"),
  bulkUpdateProductsHandler
);
router.post(
  "/admin/products",
  ...adminOnly,
  idempotency("product-create"),
  createProductHandler
);
router.put(
  "/admin/products/:id",
  ...adminOnly,
  idempotency("product-update"),
  updateProductHandler
);
router.delete("/admin/products/:id", ...adminOnly, deleteProductHandler);
router.post(
  "/admin/products/:productId/variants",
  ...adminOnly,
  createVariantHandler
);
router.put("/admin/variants/:id", ...adminOnly, updateVariantHandler);
router.delete("/admin/variants/:id", ...adminOnly, deleteVariantHandler);

export default router;
