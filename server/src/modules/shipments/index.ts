import { Router } from "express";
import shipmentsRoutes from "./shipments.routes.ts";
import shipmentsPublicRoutes from "./shipments.public.routes.ts";

const router = Router();

router.use(shipmentsRoutes);
router.use(shipmentsPublicRoutes);

export default router;
