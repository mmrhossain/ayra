import { Router } from "express";
import geographyRoutes from "./routes/geography.routes.ts";

const router = Router();

router.use(geographyRoutes);

export default router;
