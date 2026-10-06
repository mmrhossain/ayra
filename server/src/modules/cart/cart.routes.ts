import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.ts";

import {
  getCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
  clearCartHandler,
  getGuestCartHandler,
  saveGuestCartHandler,
  mergeGuestCartHandler,
  applyCouponHandler,
  removeCouponHandler,
} from "./cart.controller.ts";
import {checkoutHandler} from "../order/controllers/order.controller.ts"


const router = Router();

// Authenticated user cart
router.get("/cart", requireAuth, getCartHandler);
router.post("/cart/items", requireAuth, addItemHandler);
router.put("/cart/items/:variantId", requireAuth, updateItemHandler);
router.delete("/cart/items/:variantId", requireAuth, removeItemHandler);
router.delete("/cart", requireAuth, clearCartHandler);
router.post("/cart/guest/merge", requireAuth, mergeGuestCartHandler);
router.post("/cart/coupon", requireAuth, applyCouponHandler);
router.delete("/cart/coupon", requireAuth, removeCouponHandler);
router.post("/cart/checkout", requireAuth, checkoutHandler);

// Guest cart (no auth, sessionId-scoped)
router.get("/cart/guest", getGuestCartHandler);
router.put("/cart/guest", saveGuestCartHandler);

export default router;
