import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(500),
  conversationId: z.string().min(1).max(128).optional(),
});
