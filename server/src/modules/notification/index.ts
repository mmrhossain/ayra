import { Router } from "express";
import inAppRoutes from "./in-app.routes.ts";

const router = Router();

router.use(inAppRoutes);

export default router;
