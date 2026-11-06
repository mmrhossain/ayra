import { getBaseEmailTemplate } from "./email.ts";

export const ORDER_STATUS_UPDATE_CODE = "ORDER_STATUS_UPDATE";

export const ORDER_STATUS_MESSAGES = {
  PROCESSING: {
    label: "Processing",
    description: "We are preparing your order for shipment.",
  },
  PACKED: {
    label: "Packed",
    description: "Your order has been packed and is ready for courier pickup.",
  },
  SHIPPED: {
    label: "Shipped",
    description: "Your order has left our warehouse and is on the way.",
  },
  DELIVERED: {
    label: "Delivered",
    description: "Your order has been delivered. We hope you enjoy it.",
  },
  CANCELLED: {
    label: "Cancelled",
    description:
      "Your order has been cancelled. If you were charged, a refund will follow.",
  },
  RETURN_REQUESTED: {
    label: "Return requested",
    description:
      "We received your return request and will review it shortly.",
  },
  RETURNED: {
    label: "Returned",
    description: "Your return has been approved and processed.",
  },
  REFUNDED: {
    label: "Refunded",
    description: "Your refund has been processed.",
  },
} satisfies Record<string, { label: string; description: string }>;

export type NotifiableOrderStatus = keyof typeof ORDER_STATUS_MESSAGES;

export const ORDER_STATUS_UPDATE_TEMPLATE = {
  code: ORDER_STATUS_UPDATE_CODE,
  name: "Order Status Update",
  channel: "EMAIL" as const,
  subject: "Order {{orderNumber}} - {{statusLabel}}",
  content: getBaseEmailTemplate({
    title: "Order update",
    userName: "{{customerName}}",
    message:
      "Your order <strong>{{orderNumber}}</strong> is now <strong>{{statusLabel}}</strong>.<br/><br/>{{statusDescription}}",
    buttonText: "View order",
    buttonUrl: "{{orderUrl}}",
    footerNote:
      "You are receiving this because a status of your order changed.",
  }),
  variables: [
    "customerName",
    "orderNumber",
    "statusLabel",
    "statusDescription",
    "orderUrl",
  ],
};
