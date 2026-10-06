import { Router } from "express";
import wishlistRoutes from "./routes/wishlist.routes.ts";

const router = Router();

router.use(wishlistRoutes);

export default router;
