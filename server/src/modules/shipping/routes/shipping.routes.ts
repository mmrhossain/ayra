import { Router } from "express";
import { requireAuth } from "../../../common/middleware/auth.middleware.ts";
import {
  getShippingOptionsHandler,
  quoteShippingHandler,
} from "../controllers/shipping.controller.ts";

const router = Router();

router.get("/shipping/options", requireAuth, getShippingOptionsHandler);
router.post("/shipping/quote", requireAuth, quoteShippingHandler);

export default router;
