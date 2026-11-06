import type { StatusBadgeVariant } from "@/components/ui/status-badge";
import { DashboardApiError } from "@/lib/api/dashboard";
import type {
  CourierProvider,
  ShipmentStatus,
} from "@/features/dashboard/admin/shipments/types/models";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
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
];

export const COURIER_PROVIDERS: CourierProvider[] = [
  "INTERNAL",
  "PATHAO",
  "REDX",
  "STEADFAST",
  "PAPERFLY",
  "DHL",
  "FEDEX",
];

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

export function nextShipmentStatuses(status: ShipmentStatus): ShipmentStatus[] {
  return SHIPMENT_TRANSITIONS[status] ?? [];
}

export function shipmentStatusVariant(status: ShipmentStatus): StatusBadgeVariant {
  if (status === "DELIVERED") return "success";
  if (status === "CANCELLED" || status === "FAILED" || status === "RETURNED") {
    return "danger";
  }
  if (status === "PENDING") return "warning";
  return "info";
}

export function toShipmentErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function formatShipmentDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
