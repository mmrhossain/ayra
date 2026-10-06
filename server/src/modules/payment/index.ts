import { Router } from "express";
import paymentRoutes from "./routes/payment.routes.ts";
import paymentAdminRoutes from "./routes/payment.admin.routes.ts";

const router = Router();

router.use(paymentRoutes);
router.use(paymentAdminRoutes);

export default router;
