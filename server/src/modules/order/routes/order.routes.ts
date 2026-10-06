import { Router } from "express";
import {
  requireAuth,
} from "../../../common/middleware/auth.middleware.ts";

import {
  checkoutHandler,
  listMyOrdersHandler,
  getMyOrderHandler,
  cancelOrderHandler,
} from "../controllers/order.controller.ts";
import { createReturnRequestHandler } from "../controllers/return.controller.ts";

const router = Router();

router.post("/checkout", requireAuth, checkoutHandler);
router.get("/orders", requireAuth, listMyOrdersHandler);
router.get("/orders/:id", requireAuth, getMyOrderHandler);
router.post("/orders/:id/cancel", requireAuth, cancelOrderHandler);
router.post("/orders/:id/return-request", requireAuth, createReturnRequestHandler);

export default router;
