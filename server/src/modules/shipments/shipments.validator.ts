import { z } from "zod";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";
import {
  COURIER_PROVIDERS,
  SHIPMENT_STATUSES,
} from "./shipments.utils.ts";

const orderReference = z.string().trim().min(1).max(100);

export const createShipmentSchema = z.object({
  orderId: orderReference,
  warehouseId: z.string().trim().min(1),
  courierProvider: z.enum(COURIER_PROVIDERS),
  trackingNumber: z.string().trim().min(1).max(200).optional(),
  courierReference: z.string().trim().min(1).max(200).optional(),
  shippingCost: z.coerce.number().min(0).max(1_000_000).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(10_000),
      }),
    )
    .min(1)
    .max(200),
});

export const listShipmentsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SHIPMENT_STATUSES).optional(),
  courierProvider: z.enum(COURIER_PROVIDERS).optional(),
  orderId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(100).optional(),
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  trackingNumber: z.string().trim().min(1).max(200).optional(),
  courierReference: z.string().trim().min(1).max(200).optional(),
});

export const shipmentNumberParamSchema = z.string().trim().min(3).max(100);
