export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

// Uploads stream the file to Cloudinary and may legitimately outlast the
// default budget. Keep this comfortably above the server's worst case
// (retries x CLOUDINARY_UPLOAD_TIMEOUT_MS + reconcile), otherwise the browser
// aborts while the server keeps uploading in the background.
const parsedUploadTimeoutMs = Number(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS);
export const UPLOAD_FETCH_TIMEOUT_MS =
  Number.isFinite(parsedUploadTimeoutMs) && parsedUploadTimeoutMs > 0
    ? parsedUploadTimeoutMs
    : 240_000;

const SESSION_COOKIE_NAMES = new Set(["ayra.session_token", "__Secure-ayra.session_token"]);

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
  timeoutMs?: number;
  withSession?: boolean;
};

type ApiErrorCtor<E extends Error> = new (
  message: string,
  status: number,
  code?: string,
  details?: unknown
) => E;

type HttpClientOptions<E extends Error> = {
  error: ApiErrorCtor<E>;
  withSession?: boolean;
  defaultCache?: RequestCache;
};

function stripSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function withApiV1(value: string): string {
  return value.includes("/api/v1") ? value : `${value}/api/v1`;
}

export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/backend-proxy/api/v1`;
  }

  const origin = stripSlash(process.env.BACKEND_ORIGIN || "http://localhost:5000");
  return withApiV1(origin);
}

export function buildUrl(path: string, params?: QueryParams): string {
  const base = resolveApiBaseUrl();
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

export function parseErrorEnvelope(body: unknown): {
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

async function sessionCookieHeader(): Promise<string | null> {
  if (typeof window !== "undefined") return null;
  try {
    const { cookies } = await import("next/headers");
    const header = (await cookies())
      .getAll()
      .filter((cookie) => SESSION_COOKIE_NAMES.has(cookie.name))
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    return header || null;
  } catch {
    return null;
  }
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([signal, timeout]);
  return signal;
}

function mergeNextOptions(options: FetchOptions): FetchOptions["next"] | undefined {
  if (options.revalidate === undefined) return options.next;
  return {
    ...options.next,
    revalidate: options.revalidate,
  };
}

export function createHttpClient<E extends Error>(clientOptions: HttpClientOptions<E>) {
  async function toApiError(res: Response): Promise<E> {
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

    return new clientOptions.error(message, res.status, code, details);
  }

  async function apiRequest<T>(
    method: string,
    path: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const url = buildUrl(path, options.params);
    const headers = new Headers(options.headers);
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    if (
      options.body !== undefined &&
      !isFormData &&
      !headers.has("Content-Type") &&
      !headers.has("content-type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const forwardSession = options.withSession ?? clientOptions.withSession;
    if (forwardSession && !headers.has("cookie")) {
      const cookieHeader = await sessionCookieHeader();
      if (cookieHeader) headers.set("cookie", cookieHeader);
    }

    const next = mergeNextOptions(options);
    const isBrowser = typeof window !== "undefined";
    const cache =
      options.cache ??
      (clientOptions.defaultCache && !isBrowser ? clientOptions.defaultCache : undefined);

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
        cache,
        next: isBrowser ? undefined : next,
        signal: withTimeout(options.signal, options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS),
        credentials: forwardSession || isBrowser ? "include" : "omit",
      });
    } catch (err) {
      const timedOut =
        err instanceof DOMException &&
        (err.name === "TimeoutError" || err.name === "AbortError");
      if (timedOut) {
        throw new clientOptions.error("Request timed out. Please try again.", 0);
      }
      const cause = err instanceof Error ? err.message : "Network request failed";
      throw new clientOptions.error(`Network error: ${cause}`, 0);
    }

    if (!res.ok) {
      throw await toApiError(res);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    get: <T>(path: string, options?: FetchOptions) => apiRequest<T>("GET", path, options),
    post: <T>(path: string, options?: FetchOptions) => apiRequest<T>("POST", path, options),
    put: <T>(path: string, options?: FetchOptions) => apiRequest<T>("PUT", path, options),
    patch: <T>(path: string, options?: FetchOptions) => apiRequest<T>("PATCH", path, options),
    delete: <T>(path: string, options?: FetchOptions) => apiRequest<T>("DELETE", path, options),
  };
}
