import { api } from "@/lib/api/store-front";

export type TrackedShipment = {
  shipmentNumber: string;
  courierProvider: string;
  status: string;
  trackingNumber: string | null;
  pickupRequestedAt: string | null;
  pickedUpAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  trackingEvents: Array<{
    status: string;
    location: string | null;
    description: string | null;
    eventTime: string;
  }>;
};

type Envelope<T> = { success: boolean; message: string; data: T };

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
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

export function formatTrackingDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export async function fetchTrackedShipment(
  shipmentNumber: string,
): Promise<TrackedShipment> {
  const res = await api.get<Envelope<TrackedShipment>>(
    `/shipments/track/${encodeURIComponent(shipmentNumber)}`,
    { cache: "no-store" },
  );
  return res.data;
}
