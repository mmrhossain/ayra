import { describe, expect, it } from "vitest";
import { notificationHref } from "./notification-href";

describe("notification links", () => {
  it("keeps legacy absolute order links on the current origin", () => {
    expect(notificationHref("https://ayra-shop.vercel.app/customer/orders/view-order/501751ee-fccc-44a3-b0c8-bf60f404222f")).toBe("/customer/orders/view-order/501751ee-fccc-44a3-b0c8-bf60f404222f");
  });
  it("supports any environment and preserves queries and fragments", () => {
    expect(notificationHref("http://localhost:3000/admin/orders?page=2#order")).toBe("/admin/orders?page=2#order");
    expect(notificationHref("https://preview.example.com/customer/orders")).toBe("/customer/orders");
  });
  it("preserves relative links, missing links, and external tracking destinations", () => {
    for (const href of [null, "/customer/orders", "/admin/orders", "https://courier.example/track/123", "https://courier.example/customer-support/123"]) {
      expect(notificationHref(href)).toBe(href);
    }
  });
});
