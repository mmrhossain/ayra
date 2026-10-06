import { Router } from "express";
import sliderRoutes from "./routes/slider.routes.ts";

const router = Router();

router.use(sliderRoutes);

export default router;
