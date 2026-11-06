import { Router } from "express";
import {
  requireAuth,
  requireCustomer,
} from "../../../common/middleware/auth.middleware.ts";
import { idempotency } from "../../../common/middleware/idempotency.middleware.ts";
import { checkoutLimiter } from "../../../common/middleware/rate-limit.middleware.ts";

import {
  checkoutHandler,
  listMyOrdersHandler,
  getMyOrderHandler,
  cancelOrderHandler,
} from "../controllers/order.controller.ts";
import { createReturnRequestHandler } from "../controllers/return.controller.ts";

const router = Router();

const customerOnly = [requireAuth, requireCustomer];

router.post(
  "/checkout",
  ...customerOnly,
  checkoutLimiter,
  idempotency("checkout"),
  checkoutHandler,
);
router.get("/orders", ...customerOnly, listMyOrdersHandler);
router.get("/orders/:id", ...customerOnly, getMyOrderHandler);
router.post("/orders/:id/cancel", ...customerOnly, cancelOrderHandler);
router.post("/orders/:id/return-request", ...customerOnly, createReturnRequestHandler);

export default router;
