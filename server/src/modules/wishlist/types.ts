import type { z } from "zod";
import type {
  addWishlistItemSchema,
  listWishlistQuerySchema,
} from "./validators/wishlist.validator.ts";

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type ListWishlistQuery = z.infer<typeof listWishlistQuerySchema>;
