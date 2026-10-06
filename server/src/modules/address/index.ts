import { Router } from "express";
import addressRoutes from "./routes/address.routes.ts";

const router = Router();

router.use(addressRoutes);

export default router;
