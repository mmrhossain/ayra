import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ShipmentStatus } from "../../generated/prisma/enums.ts";

const STATUS_ALIASES: Record<string, ShipmentStatus> = {
  pickup_requested: "PICKUP_REQUESTED",
  pickup_pending: "PICKUP_REQUESTED",
  picked: "PICKED_UP",
  picked_up: "PICKED_UP",
  in_transit: "IN_TRANSIT",
  transit: "IN_TRANSIT",
  out_for_delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  delivery_failed: "FAILED",
  failed: "FAILED",
  returned: "RETURNED",
  return: "RETURNED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
};

const NON_ACTIONABLE_STATUSES = new Set([
  "in_review",
  "pending",
  "hold",
  "unknown",
  "partial_delivered",
  "delivered_approval_pending",
]);

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

export function mapCourierStatus(raw: unknown): ShipmentStatus | null {
  if (typeof raw !== "string") return null;
  const key = normalize(raw);
  if (NON_ACTIONABLE_STATUSES.has(key)) return null;
  return STATUS_ALIASES[key] ?? null;
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload ?? null))
    .digest("hex");
}

export function verifyHmacSignature(
  rawBody: Buffer | string | undefined,
  signature: string | undefined,
  secret: string | undefined,
): boolean {
  if (!rawBody || !signature || !secret) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const received = signature.trim().toLowerCase();

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function safeSecretEqual(
  received: string | undefined,
  secret: string | undefined,
): boolean {
  if (!received || !secret) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
