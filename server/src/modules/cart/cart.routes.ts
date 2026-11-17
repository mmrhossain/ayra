import { Router } from "express";
import { requireAuth, requireCustomer } from "../../common/middleware/auth.middleware.ts";
import { checkoutLimiter } from "../../common/middleware/rate-limit.middleware.ts";

import {
  getCartHandler,
  quoteGuestCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
  clearCartHandler,
  mergeGuestCartHandler,
  applyCouponHandler,
  removeCouponHandler,
} from "./cart.controller.ts";
import { checkoutHandler } from "../order/controllers/order.controller.ts";

const router = Router();

const customerOnly = [requireAuth, requireCustomer];

router.use("/cart", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.post("/cart/guest/quote", quoteGuestCartHandler);
router.get("/cart", ...customerOnly, getCartHandler);
router.post("/cart/items", ...customerOnly, addItemHandler);
router.put("/cart/items/:variantId", ...customerOnly, updateItemHandler);
router.delete("/cart/items/:variantId", ...customerOnly, removeItemHandler);
router.delete("/cart", ...customerOnly, clearCartHandler);
router.post("/cart/guest/merge", ...customerOnly, mergeGuestCartHandler);
router.post("/cart/coupon", ...customerOnly, applyCouponHandler);
router.delete("/cart/coupon", ...customerOnly, removeCouponHandler);
router.post("/cart/checkout", ...customerOnly, checkoutLimiter, checkoutHandler);

export default router;
