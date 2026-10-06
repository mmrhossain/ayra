import type { z } from "zod";
import type { chatSchema } from "./validators/ai.validators.ts";

export type ChatInput = z.infer<typeof chatSchema>;

export type ChatTurn = {
  role: "user" | "model";
  text: string;
};

export type ChatResult = {
  answer: string;
  cached: boolean;
  conversationId?: string;
};
