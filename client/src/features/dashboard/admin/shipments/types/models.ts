export type { Envelope } from "@/lib/api/http";

export type ShipmentStatus =
  | "PENDING"
  | "READY_TO_SHIP"
  | "PICKUP_REQUESTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";

export type CourierProvider =
  | "INTERNAL"
  | "PATHAO"
  | "REDX"
  | "STEADFAST"
  | "PAPERFLY"
  | "DHL"
  | "FEDEX";

export type ShipmentOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

export type ShipmentWarehouse = {
  id: string;
  name: string;
  code: string;
};

export type ShipmentListItem = {
  id: string;
  shipmentNumber: string;
  courierProvider: CourierProvider;
  status: ShipmentStatus;
  trackingNumber: string | null;
  courierReference: string | null;
  labelUrl: string | null;
  shippingCost: number;
  notes: string | null;
  pickupRequestedAt: string | null;
  pickedUpAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: ShipmentOrderSummary;
  warehouse: ShipmentWarehouse;
  _count: { items: number };
};

export type ShipmentDetailItem = {
  id: string;
  quantity: number;
  orderItem: {
    id: string;
    productName: string;
    sku: string;
    variantName: string | null;
    quantity: number;
  };
};

export type ShipmentTrackingEvent = {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  description: string | null;
  eventTime: string;
};

export type ShipmentAddress = {
  fullName: string;
  phone: string;
  email: string | null;
  country: string;
  division: string;
  district: string;
  thana: string | null;
  area: string | null;
  postalCode: string | null;
  addressLine1: string;
  addressLine2: string | null;
};

export type ShipmentDetail = ShipmentListItem & {
  items: ShipmentDetailItem[];
  trackingEvents: ShipmentTrackingEvent[];
  events: Array<{ id: string; eventType: string; createdAt: string }>;
  shipmentAddress: ShipmentAddress | null;
  notes: string | null;
  labelUrl: string | null;
  shippingCost: number;
  trackingNumber: string | null;
  courierReference: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export type ShipmentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ShipmentListResult = {
  items: ShipmentListItem[];
  pagination: ShipmentPagination;
};

export type ShipmentListParams = {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  courierProvider?: CourierProvider;
  search?: string;
};

export type ShipmentOrderItem = {
  id: string;
  productName: string;
  sku: string;
  variantName: string | null;
  quantity: number;
  shippedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
};

export type ShipmentOrderContext = {
  order: ShipmentOrderSummary;
  items: ShipmentOrderItem[];
  shipments: Array<{
    id: string;
    shipmentNumber: string;
    status: ShipmentStatus;
    createdAt: string;
  }>;
  warehouses: ShipmentWarehouse[];
};

export type CreateShipmentBody = {
  orderId: string;
  warehouseId: string;
  courierProvider: CourierProvider;
  trackingNumber?: string;
  courierReference?: string;
  shippingCost?: number;
  notes?: string;
  items: Array<{ orderItemId: string; quantity: number }>;
};

export type UpdateShipmentStatusBody = {
  status: ShipmentStatus;
  location?: string;
  description?: string;
  trackingNumber?: string;
  courierReference?: string;
};
