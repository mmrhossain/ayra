import { getBaseEmailTemplate } from "./email.ts";

export const ORDER_CONFIRMATION_CODE = "ORDER_CONFIRMATION";

export const ORDER_CONFIRMATION_TEMPLATE = {
  code: ORDER_CONFIRMATION_CODE,
  name: "Order Confirmation",
  channel: "EMAIL" as const,
  subject: "Order Confirmed - {{orderNumber}}",
  content: getBaseEmailTemplate({
    title: "Order Confirmed",
    userName: "{{customerName}}",
    message:
      "Thank you for your order. Your order <strong>{{orderNumber}}</strong> has been placed successfully.<br/><br/>{{itemsTable}}{{summaryTable}}<br/>You can view your order and follow its shipment from your account.",
    buttonText: "View order & tracking",
    buttonUrl: "{{orderUrl}}",
    footerNote:
      "Questions about your order? Reply to this email and our team will help.",
  }),
  variables: [
    "customerName",
    "orderNumber",
    "itemsTable",
    "summaryTable",
    "orderUrl",
  ],
};
