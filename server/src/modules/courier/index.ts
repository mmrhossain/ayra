import { Router } from "express";
import courierRoutes from "./courier.routes.ts";

const router = Router();

router.use(courierRoutes);

export default router;
