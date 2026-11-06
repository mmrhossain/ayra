import { z } from "zod";
import { addressFieldsSchema } from "../../common/validators/address.ts";
import { paymentMethodSchema } from "../payment/validators/payment.validators.ts";

export const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(999),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(100),
});

const guestCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

export const mergeGuestCartSchema = z.object({
  items: z.array(guestCartItemSchema).max(100).default([]),
});

export const checkoutSchema = z.object({
  paymentMethod: paymentMethodSchema,
  billingAddress: addressFieldsSchema,
  shippingAddress: addressFieldsSchema.optional(),
  shippingMethodCode: z.string().min(1),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  // Subtotal the customer saw before confirming. The server still recomputes
  // every amount; this is only used to detect a silent price change.
  expectedSubtotal: z.coerce.number().nonnegative().max(1_000_000).multipleOf(0.01).optional(),
  acceptPriceChange: z.boolean().optional(),
});