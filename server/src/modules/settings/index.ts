import { Router } from "express";
import settingsRoutes from "./routes/settings.routes.ts";
import settingsAdminRoutes from "./routes/settings.admin.routes.ts";

const router = Router();

router.use(settingsRoutes);
router.use(settingsAdminRoutes);

export default router;
