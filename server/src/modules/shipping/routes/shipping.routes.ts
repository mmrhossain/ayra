import { Router } from "express";
import { requireAuth, requireCustomer } from "../../../common/middleware/auth.middleware.ts";
import {
  getShippingOptionsHandler,
  quoteShippingHandler,
} from "../controllers/shipping.controller.ts";

const router = Router();

const customerOnly = [requireAuth, requireCustomer];

router.get("/shipping/options", ...customerOnly, getShippingOptionsHandler);
router.post("/shipping/quote", ...customerOnly, quoteShippingHandler);

export default router;
