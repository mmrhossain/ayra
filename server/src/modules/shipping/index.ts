import { Router } from "express";
import shippingRoutes from "./routes/shipping.routes.ts";
import shippingAdminRoutes from "./routes/shipping.admin.routes.ts";

const router = Router();

router.use(shippingRoutes);
router.use(shippingAdminRoutes);

export default router;
