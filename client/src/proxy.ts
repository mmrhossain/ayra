import { SESSION_COOKIE } from "@/config";
import { NextRequest, NextResponse } from "next/server";

function hasSessionCookie(request: NextRequest): boolean {
  const session =
    request.cookies.get(SESSION_COOKIE) ??
    request.cookies.get(`__Secure-${SESSION_COOKIE}`);

  return Boolean(session?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasSessionCookie(request);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/account-suspended";

  // Prevent authenticated users from visiting auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect private routes
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/vendor/:path*",
    "/customer/:path*",
    "/checkout",
  ],
};
