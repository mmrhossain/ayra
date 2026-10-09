const STORAGE_KEY = "ayra-ai-conversation-id";

export function getConversationId(): string {
  if (typeof window === "undefined") return "";

  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}
