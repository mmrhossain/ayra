import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  assertShipmentTransition,
  generateShipmentNumber,
  isCourierStatusUpdateAllowed,
  NOTIFIABLE_SHIPMENT_STATUSES,
  SHIPMENT_EVENT_BY_STATUS,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_TIMESTAMP_FIELD,
  shipmentStatusLabel,
  toNumber,
} from "../../src/modules/shipments/shipments.utils.ts";

describe("shipment transitions", () => {
  it("allows the happy path", () => {
    expect(allowedNextStatuses("PENDING")).toContain("READY_TO_SHIP");
    expect(allowedNextStatuses("READY_TO_SHIP")).toContain("PICKUP_REQUESTED");
    expect(allowedNextStatuses("PICKUP_REQUESTED")).toContain("PICKED_UP");
    expect(allowedNextStatuses("PICKED_UP")).toContain("IN_TRANSIT");
    expect(allowedNextStatuses("IN_TRANSIT")).toContain("OUT_FOR_DELIVERY");
    expect(allowedNextStatuses("OUT_FOR_DELIVERY")).toContain("DELIVERED");
  });

  it("rejects invalid transitions", () => {
    expect(() => assertShipmentTransition("PENDING", "DELIVERED")).toThrow(
      "Invalid shipment transition",
    );
    expect(() => assertShipmentTransition("CANCELLED", "PENDING")).toThrow(
      "Invalid shipment transition",
    );
  });

  it("keeps terminal statuses terminal", () => {
    expect(allowedNextStatuses("RETURNED")).toEqual([]);
    expect(allowedNextStatuses("CANCELLED")).toEqual([]);
  });
});

describe("courier status updates", () => {
  it("allows forward jumps from webhooks", () => {
    expect(isCourierStatusUpdateAllowed("PICKUP_REQUESTED", "DELIVERED")).toBe(
      true,
    );
    expect(isCourierStatusUpdateAllowed("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(
      true,
    );
    expect(isCourierStatusUpdateAllowed("DELIVERED", "RETURNED")).toBe(true);
    expect(isCourierStatusUpdateAllowed("IN_TRANSIT", "CANCELLED")).toBe(true);
  });

  it("rejects backward or terminal transitions", () => {
    expect(isCourierStatusUpdateAllowed("IN_TRANSIT", "PICKED_UP")).toBe(false);
    expect(isCourierStatusUpdateAllowed("DELIVERED", "CANCELLED")).toBe(false);
    expect(isCourierStatusUpdateAllowed("RETURNED", "DELIVERED")).toBe(false);
    expect(isCourierStatusUpdateAllowed("PENDING", "RETURNED")).toBe(false);
  });
});

describe("shipment metadata", () => {
  it("maps statuses to timestamps", () => {
    expect(SHIPMENT_TIMESTAMP_FIELD.PICKUP_REQUESTED).toBe("pickupRequestedAt");
    expect(SHIPMENT_TIMESTAMP_FIELD.PICKED_UP).toBe("pickedUpAt");
    expect(SHIPMENT_TIMESTAMP_FIELD.IN_TRANSIT).toBe("shippedAt");
    expect(SHIPMENT_TIMESTAMP_FIELD.DELIVERED).toBe("deliveredAt");
    expect(SHIPMENT_TIMESTAMP_FIELD.RETURNED).toBe("returnedAt");
  });

  it("maps statuses to event types", () => {
    expect(SHIPMENT_EVENT_BY_STATUS.DELIVERED).toBe("DELIVERED");
    expect(SHIPMENT_EVENT_BY_STATUS.CANCELLED).toBeUndefined();
    expect(SHIPMENT_EVENT_BY_STATUS.FAILED).toBeUndefined();
  });
});

describe("generateShipmentNumber", () => {
  it("generates unique prefixed numbers", () => {
    const first = generateShipmentNumber();
    const second = generateShipmentNumber();
    expect(first).toMatch(/^SHP-[0-9A-Z]+-[0-9A-Z]+$/);
    expect(second).not.toBe(first);
  });
});

describe("shipment notification helpers", () => {
  it("labels every shipment status", () => {
    for (const status of SHIPMENT_STATUSES) {
      expect(SHIPMENT_STATUS_LABELS[status]).toBeTruthy();
      expect(shipmentStatusLabel(status)).toBe(SHIPMENT_STATUS_LABELS[status]);
    }
  });

  it("only notifies for customer-facing statuses", () => {
    expect(NOTIFIABLE_SHIPMENT_STATUSES).toContain("DELIVERED");
    expect(NOTIFIABLE_SHIPMENT_STATUSES).toContain("FAILED");
    expect(NOTIFIABLE_SHIPMENT_STATUSES).not.toContain("PENDING");
    expect(NOTIFIABLE_SHIPMENT_STATUSES).not.toContain("READY_TO_SHIP");
  });
});

describe("toNumber", () => {
  it("normalizes decimal-like values", () => {
    expect(toNumber(12.5)).toBe(12.5);
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber({ toNumber: () => 9.99 })).toBe(9.99);
    expect(toNumber(null)).toBeNull();
  });
});
