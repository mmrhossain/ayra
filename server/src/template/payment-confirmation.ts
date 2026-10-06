import { getBaseEmailTemplate } from "./email.ts";

export const PAYMENT_CONFIRMATION_CODE = "PAYMENT_CONFIRMATION";

export const PAYMENT_CONFIRMATION_TEMPLATE = {
  code: PAYMENT_CONFIRMATION_CODE,
  name: "Payment Confirmation",
  channel: "EMAIL" as const,
  subject: "Payment Confirmation - {{orderNumber}}",
  content: getBaseEmailTemplate({
    title: "Payment Confirmation",
    userName: "{{customerName}}",
    message:
      "We have received your payment for order <strong>{{orderNumber}}</strong>.<br/><br/>Amount: <strong>{{amount}}</strong> {{currency}}<br/>Method: <strong>{{method}}</strong>.",
  }),
  variables: ["customerName", "orderNumber", "amount", "currency", "method"],
};
