const STORAGE_KEY = "ayra-ai-conversation-id";
const MESSAGES_STORAGE_PREFIX = "ayra-ai-chat-messages";

export function getConversationId(): string {
  if (typeof window === "undefined") return "";

  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function getConversationMessagesKey(conversationId: string): string {
  return `${MESSAGES_STORAGE_PREFIX}:${conversationId}`;
}
