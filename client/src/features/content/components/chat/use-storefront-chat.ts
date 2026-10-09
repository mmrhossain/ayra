"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/api/auth/auth-client";
import {
  CHAT_FALLBACK_MESSAGE,
  CHAT_MAX_MESSAGE,
  postChat,
} from "@/features/content/api/chat";
import { getConversationId } from "./conversation-id";
import { isProtectedIntent } from "./protected-intent";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  loginCta?: boolean;
};

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  text: "Hi, I can help with products and store questions.",
};

const LOGIN_REPLY =
  "Please log in to ask about your orders or account.";

function nextId(): string {
  return crypto.randomUUID();
}

export function useStorefrontChat() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const conversationIdRef = useRef("");

  useEffect(() => {
    conversationIdRef.current = getConversationId();
  }, []);

  const send = useCallback(async () => {
    const text = draft.trim().slice(0, CHAT_MAX_MESSAGE);
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: nextId(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");

    if (!isLoggedIn && isProtectedIntent(text)) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: LOGIN_REPLY,
          loginCta: true,
        },
      ]);
      return;
    }

    setSending(true);
    try {
      if (!conversationIdRef.current) {
        conversationIdRef.current = getConversationId();
      }
      const result = await postChat(text, conversationIdRef.current);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: result.answer || CHAT_FALLBACK_MESSAGE,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: CHAT_FALLBACK_MESSAGE,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [draft, sending, isLoggedIn]);

  return { messages, draft, setDraft, sending, send };
}
