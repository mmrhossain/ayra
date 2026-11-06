import { getBaseEmailTemplate } from "./email.ts";

export const SHIPMENT_UPDATE_CODE = "SHIPMENT_UPDATE";

export const SHIPMENT_UPDATE_TEMPLATE = {
  code: SHIPMENT_UPDATE_CODE,
  name: "Shipment Update",
  channel: "EMAIL" as const,
  subject: "Shipment {{shipmentNumber}} - {{statusLabel}}",
  content: getBaseEmailTemplate({
    title: "Shipment update",
    userName: "{{customerName}}",
    message:
      "Your shipment <strong>{{shipmentNumber}}</strong> for order <strong>{{orderNumber}}</strong> is now <strong>{{statusLabel}}</strong>.<br/><br/>{{detailsTable}}{{description}}",
    buttonText: "Track shipment",
    buttonUrl: "{{trackingUrl}}",
    footerNote:
      "You are receiving this because a shipment for your order was updated.",
  }),
  variables: [
    "customerName",
    "shipmentNumber",
    "orderNumber",
    "statusLabel",
    "detailsTable",
    "description",
    "trackingUrl",
  ],
};
