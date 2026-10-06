import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";

export const addWishlistItemSchema = z.object({
  variantId: z.string().min(1),
});

export const listWishlistQuerySchema = paginationQuerySchema;
