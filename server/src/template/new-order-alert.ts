import { getBaseEmailTemplate } from "./email.ts";

export const NEW_ORDER_ALERT_CODE = "NEW_ORDER_ALERT";

export const NEW_ORDER_ALERT_TEMPLATE = {
  code: NEW_ORDER_ALERT_CODE,
  name: "New Order Alert",
  channel: "EMAIL" as const,
  subject: "New order {{orderNumber}} - {{currency}} {{grandTotal}}",
  content: getBaseEmailTemplate({
    title: "New order received",
    userName: "{{adminName}}",
    message:
      "Order <strong>{{orderNumber}}</strong> was placed by <strong>{{customerName}}</strong> ({{customerEmail}}).<br/><br/>{{itemsTable}}{{summaryTable}}",
    buttonText: "Open orders",
    buttonUrl: "{{orderUrl}}",
    footerNote:
      "You are receiving this because you are an administrator of the store.",
  }),
  variables: [
    "adminName",
    "orderNumber",
    "customerName",
    "customerEmail",
    "currency",
    "grandTotal",
    "itemsTable",
    "summaryTable",
    "orderUrl",
  ],
};
