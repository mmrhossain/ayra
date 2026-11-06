import { SITE_URL } from "@/config/site";

export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return "/";

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/";
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("://") ||
    decoded.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(decoded)
  ) {
    return "/";
  }

  return decoded;
}

function clientOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return SITE_URL;
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
