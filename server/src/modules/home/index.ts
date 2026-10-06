import { Router } from "express";
import homeRoutes from "./routes/home.routes.ts";

const router = Router();

router.use(homeRoutes);

export default router;
