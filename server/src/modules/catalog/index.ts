import { Router } from "express";
import categoryRoutes from "./category/routes/category.routes.ts";
import brandRoutes from "./brand/routes/brand.routes.ts";
import productRoutes from "./product/routes/product.routes.ts";
import inventoryRoutes from "./inventory/routes/inventory.routes.ts";
import attributeRoutes from "./attribute/routes/attribute.routes.ts";

const router = Router();

router.use(categoryRoutes);
router.use(brandRoutes);
router.use(productRoutes);
router.use(inventoryRoutes);
router.use(attributeRoutes);

export default router;
