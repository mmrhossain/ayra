import { Router } from "express";
import profileRoutes from "./routes/profile.routes.ts";

const router = Router();

router.use(profileRoutes);

export default router;
