import { SESSION_COOKIE } from "@/config/index";

export function hasAuthSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0];
    return name === SESSION_COOKIE || name === `__Secure-${SESSION_COOKIE}`;
  });
}
