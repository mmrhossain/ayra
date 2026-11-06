import type { CourierProvider, ShipmentStatus } from "../../generated/prisma/enums.ts";

export type CourierBookingInput = {
  shipmentNumber: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientArea?: string | undefined;
  recipientPostalCode?: string | undefined;
  codAmount: number;
  itemQuantity: number;
  itemDescription: string;
  note?: string | undefined;
};

export type CourierBookingResult = {
  trackingNumber: string;
  courierReference: string;
  labelUrl?: string | undefined;
  rawStatus?: string | undefined;
  deliveryFee?: number | undefined;
};

export type CourierWebhookEvent = {
  eventId: string;
  reference?: string | undefined;
  trackingNumber?: string | undefined;
  invoice?: string | undefined;
  status: ShipmentStatus | null;
  description?: string | undefined;
  location?: string | undefined;
  eventTime?: string | undefined;
};

export type CourierProviderAdapter = {
  provider: CourierProvider;
  book(input: CourierBookingInput): Promise<CourierBookingResult>;
  parseWebhook(payload: unknown): CourierWebhookEvent;
};
