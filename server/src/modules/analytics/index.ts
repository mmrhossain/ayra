import { Router } from "express";
import analyticsRoutes from "./routes/analytics.routes.ts";

const router = Router();

router.use(analyticsRoutes);

export default router;
