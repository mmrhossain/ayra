import { Router } from "express";
import aiRoutes from "./routes/ai.routes.ts";

const router = Router();

router.use(aiRoutes);

export default router;
