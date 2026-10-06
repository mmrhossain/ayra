import { CALLBACK_URL } from "@/config";

export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  return raw;
}

function clientOrigin(): string {
  if (CALLBACK_URL) return CALLBACK_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function oauthCallbackUrl(redirect: string): string {
  const path = safeRedirectPath(redirect);
  return `${clientOrigin()}/oauth/complete?redirect=${encodeURIComponent(path)}`;
}

export function oauthErrorCallbackUrl(redirect: string): string {
  const path = safeRedirectPath(redirect);
  const origin = clientOrigin();
  if (path === "/") return `${origin}/login`;
  return `${origin}/login?redirect=${encodeURIComponent(path)}`;
}
