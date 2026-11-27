import { api } from "@/lib/api/store-front";
import type { Envelope } from "@/features/content/types";

export const CHAT_FALLBACK_MESSAGE =
  "The AI chat is temporarily unavailable. Please try again in a little while.";

export const CHAT_MAX_MESSAGE = 500;

export type ChatResult = {
  answer: string;
  cached: boolean;
  conversationId?: string;
  productCount?: number;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    price: number | null;
  }>;
};

export async function postChat(
  message: string,
  conversationId: string
): Promise<ChatResult> {
  const res = await api.post<Envelope<ChatResult>>("/ai/chat", {
    body: {
      message: message.slice(0, CHAT_MAX_MESSAGE),
      conversationId,
    },
  });
  return res.data;
}
