import { z } from "zod";

export const contactMessageStatusSchema = z.enum(["NEW", "READ", "RESOLVED"]);

export const createContactMessageSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?\d{10,14}$/),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(5).max(5000),
});

export const listContactMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: contactMessageStatusSchema.optional(),
});

export const updateContactMessageSchema = z.object({
  status: contactMessageStatusSchema,
});

export const contactMessageIdParamSchema = z.object({
  id: z.string().uuid(),
});
