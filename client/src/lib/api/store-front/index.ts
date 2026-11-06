import { createHttpClient } from "@/lib/api/http";

export type { Envelope, FetchOptions, QueryParams } from "@/lib/api/http";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = createHttpClient({
  error: ApiError,
});
