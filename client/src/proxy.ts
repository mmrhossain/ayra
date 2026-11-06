import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./config/public";

function hasSessionCookie(request: NextRequest): boolean {
  const session =
    request.cookies.get(SESSION_COOKIE) ?? request.cookies.get(`__Secure-${SESSION_COOKIE}`);

  return Boolean(session?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasSessionCookie(request);

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/account-suspended";

  // Auth pages resolve their own destination server-side by role, so a
  // signed-in admin goes straight to /admin instead of bouncing through the
  // storefront root first. Only unauthenticated access is guarded here.
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/admin/:path*", "/customer/:path*", "/checkout"],
};
