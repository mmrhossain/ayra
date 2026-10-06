import { Router } from "express";
import orderRoutes from "./routes/order.routes.ts";
import orderAdminRoutes from "./routes/order.admin.routes.ts";

const router = Router();

router.use(orderRoutes);
router.use(orderAdminRoutes);

export default router;
