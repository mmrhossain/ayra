import type { z } from "zod";
import type {
  createContactMessageSchema,
  listContactMessagesQuerySchema,
  updateContactMessageSchema,
} from "./validators/contact.validators.ts";

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
export type ListContactMessagesQuery = z.infer<typeof listContactMessagesQuerySchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
