import { Router } from "express";
import adminAuditRoutes from "./admin-audit.routes.ts";

const router = Router();

router.use(adminAuditRoutes);

export default router;
