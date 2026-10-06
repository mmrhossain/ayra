

const normalize = (value: string | undefined): string =>
  value ? value.replace(/\/+$/, "") : "";

export const BACKEND_URL =
  normalize(process.env.NEXT_PUBLIC_BACKEND_URL) || "/backend-proxy";

export const BACKEND_ORIGIN = normalize(process.env.BACKEND_ORIGIN);

export const BETTER_AUTH_URL = normalize(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
export const CALLBACK_URL = normalize(process.env.NEXT_PUBLIC_CALLBACK_URL);

export const ADMIN_ROLE = process.env.BACKEND_ADMIN_ROLE || "ADMIN";
export const VENDOR_ROLE = process.env.BACKEND_VENDOR_ROLE || "VENDOR";
export const CUSTOMER_ROLE = process.env.BACKEND_CUSTOMER_ROLE || "CUSTOMER";


export const SESSION_COOKIE = "rangalay.session_token";
