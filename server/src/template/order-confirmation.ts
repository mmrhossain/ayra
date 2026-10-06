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
      "Thank you for your order. Your order <strong>{{orderNumber}}</strong> has been placed successfully.<br/><br/>Items:<br/>{{items}}<br/><br/>Grand total: <strong>{{grandTotal}}</strong> {{currency}}.",
  }),
  variables: ["customerName", "orderNumber", "items", "grandTotal", "currency"],
};
