import { Router } from "express";
import warehouseRoutes from "./routes/warehouse.routes.ts";

const router = Router();

router.use(warehouseRoutes);

export default router;
