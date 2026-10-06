import type { z } from "zod";
import type {
  addItemSchema,
  applyCouponSchema,
  checkoutSchema,
  guestCartSchema,
  mergeGuestCartSchema,
  saveGuestCartSchema,
  updateItemSchema,
} from "./cart.validator.ts";

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type GuestCartInput = z.infer<typeof guestCartSchema>;
export type SaveGuestCartInput = z.infer<typeof saveGuestCartSchema>;
export type MergeGuestCartInput = z.infer<typeof mergeGuestCartSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type GuestCartItem = {
  variantId: string;
  quantity: number;
  productName?: string | undefined;
  productSlug?: string | null | undefined;
  productImage?: string | null | undefined;
  sku?: string | undefined;
  unitPrice?: number | undefined;
  compareAtPrice?: number | null | undefined;
};

export type GuestCartData = {
  items: GuestCartItem[];
  couponCode?: string | undefined;
};

export type CartLineCreate = {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  sku: string;
  unitPrice: number;
  subtotal: number;
};

export type CartLineUpdate = {
  id: string;
  quantity: number;
  subtotal: number;
};
