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
  productName: z.string().max(255).optional(),
  productSlug: z.string().max(255).nullable().optional(),
  productImage: z.string().max(2048).nullable().optional(),
  sku: z.string().max(100).optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
});

const guestCartDataSchema = z.object({
  items: z.array(guestCartItemSchema).max(100).default([]),
  couponCode: z.string().min(1).max(100).optional(),
});

export const guestCartSchema = z.object({
  sessionId: z.string().min(1).max(255),
  cartData: guestCartDataSchema.optional(),
});

export const saveGuestCartSchema = z.object({
  sessionId: z.string().min(1).max(255),
  cartData: guestCartDataSchema,
});

export const mergeGuestCartSchema = z.object({
  sessionId: z.string().min(1).max(255),
});

export const checkoutSchema = z.object({
  paymentMethod: paymentMethodSchema,
  billingAddress: addressFieldsSchema,
  shippingAddress: addressFieldsSchema.optional(),
  shippingMethodCode: z.string().min(1),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});