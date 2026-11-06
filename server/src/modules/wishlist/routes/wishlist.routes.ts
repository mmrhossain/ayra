import { Router } from "express";
import { requireAuth, requireCustomer } from "../../../common/middleware/auth.middleware.ts";
import {
  addWishlistItemHandler,
  clearWishlistHandler,
  getWishlistHandler,
  isInWishlistHandler,
  listWishlistItemsHandler,
  removeWishlistItemHandler,
} from "../controllers/wishlist.controller.ts";

const router = Router();

const customerOnly = [requireAuth, requireCustomer];

router.get("/wishlist", ...customerOnly, getWishlistHandler);
router.get("/wishlist/items", ...customerOnly, listWishlistItemsHandler);
router.get("/wishlist/items/:variantId", ...customerOnly, isInWishlistHandler);
router.post("/wishlist/items", ...customerOnly, addWishlistItemHandler);
router.delete("/wishlist/items/:variantId", ...customerOnly, removeWishlistItemHandler);
router.delete("/wishlist", ...customerOnly, clearWishlistHandler);

export default router;
