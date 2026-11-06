const normalize = (value: string | undefined): string => (value ? value.replace(/\/+$/, "") : "");

function isLocalHost(value: string): boolean {
  return /localhost|127\.0\.0\.1/.test(value);
}

export const BACKEND_PROXY_PATH = "/backend-proxy";
export const API_V1_PREFIX = "/api/v1";
export const SESSION_COOKIE = "ayra.session_token";

export const CALLBACK_URL = normalize(process.env.NEXT_PUBLIC_CALLBACK_URL);

export const ADMIN_ROLE = "ADMIN";
export const CUSTOMER_ROLE = "CUSTOMER";

const configuredAuthOrigin = normalize(process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
export const USE_AUTH_PROXY = !configuredAuthOrigin || isLocalHost(configuredAuthOrigin);

export const BETTER_AUTH_BASE_PATH = USE_AUTH_PROXY
  ? `${BACKEND_PROXY_PATH}${API_V1_PREFIX}/auth`
  : `${API_V1_PREFIX}/auth`;

export const BETTER_AUTH_URL = USE_AUTH_PROXY ? "" : configuredAuthOrigin;
