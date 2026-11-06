import "server-only";

const normalize = (value: string | undefined): string =>
  value ? value.replace(/\/+$/, "") : "";

export const BACKEND_ORIGIN =
  normalize(process.env.BACKEND_ORIGIN) || "http://localhost:5000";

export const BACKEND_API_ORIGIN = BACKEND_ORIGIN.includes("/api/v1")
  ? BACKEND_ORIGIN
  : `${BACKEND_ORIGIN}/api/v1`;
