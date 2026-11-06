import { AppError } from "../../common/errors/AppError.ts";
import { env } from "../../config/env.ts";

export const trimBaseUrl = (value: string) => value.replace(/\/+$/, "");

const readMessage = (body: string): string | undefined => {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const message = parsed.message ?? parsed.error ?? parsed.detail;
    if (typeof message === "string") return message.slice(0, 300);
  } catch {
    // Fall through to plain text.
  }
  return body.slice(0, 300);
};

export async function courierRequest(
  url: string,
  init: RequestInit,
  provider: string,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(env.COURIER_HTTP_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(`${provider} request failed: ${message}`, 502);
  }

  const body = await response.text();
  if (!response.ok) {
    const message = readMessage(body);
    throw new AppError(
      `${provider} API error (${response.status})${message ? `: ${message}` : ""}`,
      502,
    );
  }

  if (!body) return null;

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError(`${provider} returned an invalid JSON response`, 502);
  }
}

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const asString = (value: unknown): string | undefined =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;

export const asNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : undefined;
};
