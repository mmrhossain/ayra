import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hashPayload,
  isEventOlderThan,
  mapCourierStatus,
  parseCourierEventTime,
  safeSecretEqual,
  verifyHmacSignature,
} from "../../src/modules/courier/courier.utils.ts";

describe("courier status mapping", () => {
  it("maps common Pathao statuses", () => {
    expect(mapCourierStatus("Pickup_Requested")).toBe("PICKUP_REQUESTED");
    expect(mapCourierStatus("Picked_Up")).toBe("PICKED_UP");
    expect(mapCourierStatus("In_Transit")).toBe("IN_TRANSIT");
    expect(mapCourierStatus("Delivered")).toBe("DELIVERED");
  });

  it("maps common Steadfast statuses", () => {
    expect(mapCourierStatus("in_review")).toBeNull();
    expect(mapCourierStatus("cancelled")).toBe("CANCELLED");
    expect(mapCourierStatus("partial_delivered")).toBeNull();
    expect(mapCourierStatus("delivery_failed")).toBe("FAILED");
    expect(mapCourierStatus("damaged")).toBe("DAMAGED");
    expect(mapCourierStatus("lost")).toBe("LOST");
  });

  it("normalizes separators and rejects unknown values", () => {
    expect(mapCourierStatus("OUT-FOR-DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(mapCourierStatus("out for delivery")).toBe("OUT_FOR_DELIVERY");
    expect(mapCourierStatus("teleported")).toBeNull();
    expect(mapCourierStatus(null)).toBeNull();
  });
});

describe("courier event ordering", () => {
  const receivedAt = new Date("2026-11-15T12:00:00.000Z");

  it("uses only valid, non-future event timestamps", () => {
    expect(
      parseCourierEventTime("2026-11-15T11:00:00.000Z", receivedAt),
    ).toEqual(new Date("2026-11-15T11:00:00.000Z"));
    expect(parseCourierEventTime("not-a-date", receivedAt)).toBeNull();
    expect(
      parseCourierEventTime("2026-11-15T13:00:00.000Z", receivedAt),
    ).toBeNull();
  });

  it("detects events older than the latest recorded tracking event", () => {
    expect(
      isEventOlderThan(
        new Date("2026-11-15T10:00:00.000Z"),
        new Date("2026-11-15T11:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      isEventOlderThan(
        new Date("2026-11-15T12:00:00.000Z"),
        new Date("2026-11-15T11:00:00.000Z"),
      ),
    ).toBe(false);
  });
});

describe("courier webhook security", () => {
  const secret = "test-webhook-secret";
  const body = Buffer.from('{"status":"delivered"}');

  it("verifies an HMAC signature over the raw body", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyHmacSignature(body, signature, secret)).toBe(true);
    expect(verifyHmacSignature(body, signature.toUpperCase(), secret)).toBe(
      true,
    );
  });

  it("rejects tampered or missing signatures", () => {
    expect(verifyHmacSignature(Buffer.from("{}"), "abc", secret)).toBe(false);
    expect(verifyHmacSignature(body, undefined, secret)).toBe(false);
    expect(verifyHmacSignature(body, "abc", undefined)).toBe(false);
  });

  it("compares shared secrets without leaking length", () => {
    expect(safeSecretEqual("same", "same")).toBe(true);
    expect(safeSecretEqual("same", "other")).toBe(false);
    expect(safeSecretEqual(undefined, "same")).toBe(false);
  });

  it("hashes payloads deterministically", () => {
    expect(hashPayload({ a: 1 })).toBe(hashPayload({ a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });
});
