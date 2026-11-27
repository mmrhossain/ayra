"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/api/auth/auth-client";
import {
  CHAT_FALLBACK_MESSAGE,
  CHAT_MAX_MESSAGE,
  postChat,
} from "@/features/content/api/chat";
import { getConversationId, getConversationMessagesKey } from "./conversation-id";
import { isProtectedIntent } from "./protected-intent";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  loginCta?: boolean;
  products?: NonNullable<Awaited<ReturnType<typeof postChat>>["products"]>;
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

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.text === "string"
  );
}

export function useStorefrontChat() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const conversationIdRef = useRef("");
  const messagesStorageKeyRef = useRef("");

  useEffect(() => {
    const conversationId = getConversationId();
    conversationIdRef.current = conversationId;
    messagesStorageKeyRef.current = getConversationMessagesKey(conversationId);

    try {
      const stored = sessionStorage.getItem(messagesStorageKeyRef.current);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const restored = parsed.filter(isChatMessage);
          if (restored.length) setMessages(restored.slice(-100));
        }
      }
    } catch {
      // Start with a fresh transcript when stored chat data is unavailable.
    }

    setMessagesLoaded(true);
  }, []);

  useEffect(() => {
    if (!messagesLoaded || !messagesStorageKeyRef.current) return;
    try {
      sessionStorage.setItem(messagesStorageKeyRef.current, JSON.stringify(messages.slice(-100)));
    } catch {
      // Keep the current chat usable if browser storage is unavailable or full.
    }
  }, [messages, messagesLoaded]);

  const send = async () => {
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
          products: result.products,
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
  };

  return { messages, draft, setDraft, sending, send };
}
