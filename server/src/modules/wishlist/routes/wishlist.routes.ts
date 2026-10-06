import { Router } from "express";
import { requireAuth } from "../../../common/middleware/auth.middleware.ts";
import {
  addWishlistItemHandler,
  clearWishlistHandler,
  getWishlistHandler,
  isInWishlistHandler,
  listWishlistItemsHandler,
  removeWishlistItemHandler,
} from "../controllers/wishlist.controller.ts";

const router = Router();

router.get("/wishlist", requireAuth, getWishlistHandler);
router.get("/wishlist/items", requireAuth, listWishlistItemsHandler);
router.get("/wishlist/items/:variantId", requireAuth, isInWishlistHandler);
router.post("/wishlist/items", requireAuth, addWishlistItemHandler);
router.delete("/wishlist/items/:variantId", requireAuth, removeWishlistItemHandler);
router.delete("/wishlist", requireAuth, clearWishlistHandler);

export default router;
