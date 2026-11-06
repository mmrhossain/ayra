import { AppError } from "../../common/errors/AppError.ts";
import type {
  CourierProvider,
  ShipmentEventType,
  ShipmentStatus,
} from "../../generated/prisma/enums.ts";

export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["PICKUP_REQUESTED", "PICKED_UP", "CANCELLED"],
  PICKUP_REQUESTED: ["PICKED_UP", "FAILED", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "RETURNED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  FAILED: ["READY_TO_SHIP", "RETURNED", "CANCELLED"],
  RETURNED: [],
  CANCELLED: [],
};

export const SHIPMENT_EVENT_BY_STATUS: Partial<
  Record<ShipmentStatus, ShipmentEventType>
> = {
  PICKUP_REQUESTED: "PICKUP_REQUESTED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  RETURNED: "RETURNED",
};

export const SHIPMENT_TIMESTAMP_FIELD: Partial<
  Record<
    ShipmentStatus,
    "pickupRequestedAt" | "pickedUpAt" | "shippedAt" | "deliveredAt" | "returnedAt"
  >
> = {
  PICKUP_REQUESTED: "pickupRequestedAt",
  PICKED_UP: "pickedUpAt",
  IN_TRANSIT: "shippedAt",
  DELIVERED: "deliveredAt",
  RETURNED: "returnedAt",
};

export const COURIER_PROVIDERS = [
  "INTERNAL",
  "PATHAO",
  "REDX",
  "STEADFAST",
  "PAPERFLY",
  "DHL",
  "FEDEX",
] as const satisfies readonly CourierProvider[];

export const SHIPMENT_STATUSES = [
  "PENDING",
  "READY_TO_SHIP",
  "PICKUP_REQUESTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
] as const satisfies readonly ShipmentStatus[];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "Pending",
  READY_TO_SHIP: "Ready to ship",
  PICKUP_REQUESTED: "Pickup requested",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

export const NOTIFIABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
];

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

export function allowedNextStatuses(status: ShipmentStatus): ShipmentStatus[] {
  return SHIPMENT_TRANSITIONS[status] ?? [];
}

const COURIER_FORWARD_ORDER: ShipmentStatus[] = [
  "PENDING",
  "READY_TO_SHIP",
  "PICKUP_REQUESTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function isCourierStatusUpdateAllowed(
  from: ShipmentStatus,
  to: ShipmentStatus,
): boolean {
  if (from === to) return false;
  if (from === "RETURNED" || from === "CANCELLED") return false;

  if (to === "CANCELLED") return from !== "DELIVERED";
  if (to === "FAILED") {
    return (
      from === "PICKUP_REQUESTED" ||
      from === "PICKED_UP" ||
      from === "IN_TRANSIT" ||
      from === "OUT_FOR_DELIVERY"
    );
  }
  if (to === "RETURNED") {
    return (
      from === "PICKED_UP" ||
      from === "IN_TRANSIT" ||
      from === "OUT_FOR_DELIVERY" ||
      from === "DELIVERED"
    );
  }

  return (
    COURIER_FORWARD_ORDER.indexOf(to) > COURIER_FORWARD_ORDER.indexOf(from)
  );
}

export function assertShipmentTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
) {
  if (!allowedNextStatuses(from).includes(to)) {
    throw new AppError(`Invalid shipment transition from ${from} to ${to}`, 400);
  }
}

export function generateShipmentNumber(now = Date.now()): string {
  const stamp = now.toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SHP-${stamp}-${random}`;
}

export function toNumber(
  value: { toNumber: () => number } | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}
