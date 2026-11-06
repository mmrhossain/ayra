const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|card(number)?|cvv|cvc|otp|pin/i;

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_DEPTH = 3;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const KNOWN_ACTION_SEGMENTS = new Set([
  "approve",
  "audit",
  "bulk",
  "cancel",
  "deliver",
  "publish",
  "refund",
  "reject",
  "restore",
  "ship",
  "status",
  "unpublish",
  "verify",
]);

export type AuditTarget = {
  path: string;
  entityType?: string | undefined;
  entityId?: string | undefined;
};

export function shouldAuditMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function parseAuditTarget(originalUrl: string): AuditTarget {
  const [rawPath = ""] = originalUrl.split("?");
  const relative = rawPath.replace(/^\/api\/v1\/admin\/?/, "");
  const segments = relative.split("/").filter(Boolean);

  const entityType = segments[0];
  const candidate = segments[1];
  const entityId =
    candidate && !KNOWN_ACTION_SEGMENTS.has(candidate.toLowerCase())
      ? candidate
      : undefined;

  return { path: rawPath, entityType, entityId };
}

const METHOD_VERBS: Record<string, string> = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

/**
 * Builds a stable `resource.action` label for audit filtering, e.g.
 * `PATCH /admin/orders/123/status` becomes `orders.update`.
 */
export function deriveAuditAction(
  method: string,
  target: AuditTarget,
): string | null {
  const verb = METHOD_VERBS[method.toUpperCase()];
  const resource = target.entityType?.toLowerCase();
  if (!verb || !resource) return null;
  return `${resource}.${verb}`;
}

export function redactAuditPayload(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}...`
      : value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactAuditPayload(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEY.test(key)
        ? "[redacted]"
        : redactAuditPayload(nested, depth + 1),
    ]),
  );
}
