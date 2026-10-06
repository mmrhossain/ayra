export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type FetchOptions = {
  headers?: HeadersInit;
  body?: unknown;
  params?: QueryParams;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  revalidate?: number | false;
  signal?: AbortSignal;
};

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function withApiV1(value: string): string {
  return value.includes("/api/v1") ? value : `${value}/api/v1`;
}

function isLocalHost(value: string): boolean {
  return /localhost|127\.0\.0\.1/.test(value);
}

function resolveBaseUrl(): string {
  const publicUrl = stripSlash(process.env.NEXT_PUBLIC_BACKEND_URL || "");

  if (typeof window !== "undefined") {
    const isRemoteAbsolute =
      /^https?:\/\//.test(publicUrl) && !isLocalHost(publicUrl);
    if (isRemoteAbsolute) return withApiV1(publicUrl);
    return `${window.location.origin}/backend-proxy/api/v1`;
  }

  if (publicUrl && /^https?:\/\//.test(publicUrl)) return withApiV1(publicUrl);

  const origin = stripSlash(
    process.env.BACKEND_ORIGIN || "http://localhost:5000",
  );
  return withApiV1(origin);
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = resolveBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + normalizedPath);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function parseErrorEnvelope(body: unknown): {
  message: string;
  code?: string;
  details?: unknown;
} {
  const fallback = { message: "Request failed" };
  if (typeof body !== "object" || body === null) return fallback;

  const obj = body as Record<string, unknown>;
  const message =
    typeof obj.message === "string"
      ? obj.message
      : typeof obj.error === "string"
        ? obj.error
        : fallback.message;

  return {
    message,
    code: typeof obj.code === "string" ? obj.code : undefined,
    details: obj.errors ?? obj.fieldErrors ?? obj.details ?? undefined,
  };
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let code: string | undefined;
  let details: unknown;

  try {
    const parsed = parseErrorEnvelope(await res.json());
    message = parsed.message;
    code = parsed.code;
    details = parsed.details;
  } catch {
    // non-JSON body
  }

  return new ApiError(message, res.status, code, details);
}

async function apiRequest<T>(
  method: string,
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (
    options.body !== undefined &&
    !isFormData &&
    !headers.has("Content-Type") &&
    !headers.has("content-type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const next =
    options.revalidate !== undefined
      ? { revalidate: options.revalidate }
      : options.next;

  let res: Response;

  try {
    res = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      cache: options.cache,
      next,
      signal: options.signal,
      credentials: "include",
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : "Network request failed";
    throw new ApiError(`Network error: ${cause}`, 0);
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiRequest<T>("GET", path, options),
  post: <T>(path: string, options?: FetchOptions) =>
    apiRequest<T>("POST", path, options),
  put: <T>(path: string, options?: FetchOptions) =>
    apiRequest<T>("PUT", path, options),
  patch: <T>(path: string, options?: FetchOptions) =>
    apiRequest<T>("PATCH", path, options),
  delete: <T>(path: string, options?: FetchOptions) =>
    apiRequest<T>("DELETE", path, options),
};
