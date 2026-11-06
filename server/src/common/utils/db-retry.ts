const TRANSIENT_DB_CODES = new Set([
  "P1001",
  "P1017",
  "P2024",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
]);

export const isTransientDbError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const e = error as { code?: string; message?: string };
  const code = String(e.code ?? "");
  if (TRANSIENT_DB_CODES.has(code)) return true;

  const message = (e.message ?? "").toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("connection terminated") ||
    message.includes("connection reset") ||
    message.includes("server closed the connection") ||
    message.includes("connection timed out") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused")
  );
};

export const withDbRetry = async <T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw lastError;
};

/**
 * Races a database operation against a hard deadline. The underlying driver may
 * still be waiting out its own `query_timeout`, but the caller (and thus the
 * HTTP request) is released promptly with `onTimeout()`'s error. Use on request
 * paths so an unreachable database fails fast instead of stalling the response.
 */
export const withDbTimeout = async <T>(
  fn: () => Promise<T>,
  ms: number,
  onTimeout: () => Error,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(onTimeout()), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};
