import { Router } from "express";
import reviewRoutes from "./routes/review.routes.ts";

const router = Router();

router.use(reviewRoutes);

export default router;
