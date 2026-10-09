import { api } from "@/lib/api/store-front";
import type { Envelope } from "@/features/content/types";

export const CHAT_FALLBACK_MESSAGE =
  "এই মুহূর্তে সাড়া দিতে সমস্যা হচ্ছে, একটু পরে চেষ্টা করুন";

export const CHAT_MAX_MESSAGE = 500;

export type ChatResult = {
  answer: string;
  cached: boolean;
  conversationId?: string;
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
