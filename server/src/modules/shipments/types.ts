import type {
  CourierProvider,
  ShipmentStatus,
} from "../../generated/prisma/enums.ts";

export type CreateShipmentInput = {
  orderId: string;
  warehouseId: string;
  courierProvider: CourierProvider;
  trackingNumber?: string | undefined;
  courierReference?: string | undefined;
  shippingCost?: number | undefined;
  notes?: string | undefined;
  items: Array<{ orderItemId: string; quantity: number }>;
};

export type ListShipmentsQuery = {
  page: number;
  limit: number;
  status?: ShipmentStatus | undefined;
  courierProvider?: CourierProvider | undefined;
  orderId?: string | undefined;
  search?: string | undefined;
};

export type UpdateShipmentStatusInput = {
  status: ShipmentStatus;
  location?: string | undefined;
  description?: string | undefined;
  trackingNumber?: string | undefined;
  courierReference?: string | undefined;
};
