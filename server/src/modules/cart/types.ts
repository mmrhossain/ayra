import type { z } from "zod";
import type {
  addItemSchema,
  applyCouponSchema,
  checkoutSchema,
  mergeGuestCartSchema,
  updateItemSchema,
} from "./cart.validator.ts";

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type MergeGuestCartInput = z.infer<typeof mergeGuestCartSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type GuestCartItem = {
  variantId: string;
  quantity: number;
};

export type CartLineCreate = {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  sku: string;
  unitPrice: number;
  subtotal: number;
};

export type CartLineUpdate = {
  id: string;
  quantity: number;
  subtotal: number;
};
