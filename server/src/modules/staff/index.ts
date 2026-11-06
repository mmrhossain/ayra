import { Router } from "express";
import staffRoutes from "./staff.routes.ts";

const router = Router();

router.use(staffRoutes);

export default router;
