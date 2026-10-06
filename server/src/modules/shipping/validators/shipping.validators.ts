import { z } from "zod";
import { addressFieldsSchema } from "../../../common/validators/address.ts";

const moneySchema = z.coerce.number().nonnegative();

export const createShippingZoneSchema = z.object({
  name: z.string().min(1).max(200),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/),
  isActive: z.boolean().default(true),
  isFallback: z.boolean().default(false),
  matchDistricts: z.array(z.string().min(1)).default([]),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();

export const createShippingMethodSchema = z.object({
  name: z.string().min(1).max(200),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/),
  isActive: z.boolean().default(true),
});

export const updateShippingMethodSchema = createShippingMethodSchema.partial();

export const createShippingRateSchema = z.object({
  shippingZoneId: z.string().min(1),
  shippingMethodId: z.string().min(1),
  price: moneySchema,
  freeShippingFrom: moneySchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateShippingRateSchema = z.object({
  shippingZoneId: z.string().min(1).optional(),
  shippingMethodId: z.string().min(1).optional(),
  price: moneySchema.optional(),
  freeShippingFrom: moneySchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const shippingQuoteSchema = z.object({
  shippingMethodCode: z.string().min(1),
  shippingAddress: addressFieldsSchema.optional(),
  district: z.string().min(1).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
});

export const shippingOptionsQuerySchema = z.object({
  district: z.string().min(1).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
});
