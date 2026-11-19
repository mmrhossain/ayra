import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { InvoiceDocument, OrderInvoice } from "./order-invoice";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";
import type { PublicSettings } from "@/features/settings/types";

const store: PublicSettings["store"] = {
  name: "AYRA", supportEmail: "care@example.com", supportPhone: "+880 1700 000000",
  address: "Dhaka, Bangladesh", logoUrl: "", ogImageUrl: "", currency: "BDT",
};
const order: CustomerOrder = {
  id: "demo-order", orderNumber: "AYR-261119-001", invoiceNumber: "INV-2026-001",
  status: "CONFIRMED", paymentStatus: "PAID", currency: "BDT",
  createdAt: "2026-11-19T05:30:00Z", subtotal: "2500.50", discountAmount: "100.00",
  taxAmount: "120.03", shippingAmount: "80.00", grandTotal: "2600.53",
  shippingMethodName: "Standard delivery",
  items: [{ id: "item-1", productName: "Handwoven Cotton Scarf", sku: "AYR-SCF-001",
    variantName: "Ivory / One size", quantity: 2, unitPrice: "1250.25", subtotal: "2500.50",
    taxClassName: "Reduced VAT", taxRate: "5", taxAmount: "120.03" }],
  shippingAddress: {
    fullName: "Ayesha Rahman", phone: "+880 1700 123456", email: "ayesha@example.com",
    country: "Bangladesh", division: "Dhaka", district: "Dhaka", thana: "Dhanmondi",
    postalCode: "1209", addressLine1: "House 12, Road 7", addressLine2: "Dhanmondi",
  },
  payments: [{ id: "payment-1", method: "SSLCOMMERZ", status: "PAID", amount: "2600.53", createdAt: "2026-11-19", refunds: [] }],
};
function documentFor(value: CustomerOrder) {
  return new DOMParser().parseFromString(renderToStaticMarkup(<InvoiceDocument order={value} store={store} />), "text/html");
}
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe("order invoice", () => {
  it("prints stored decimal amounts and tax snapshots without recalculating totals", () => {
    const doc = documentFor(order);
    expect(doc.body.textContent).toContain("2,600.53");
    expect(doc.body.textContent).toContain("1,250.25");
    expect(doc.body.textContent).toContain("-100.00");
    expect(doc.body.textContent).toContain("Reduced VAT: 5%");
    expect(doc.body.textContent).toContain("Ivory / One size");
    expect(doc.querySelector(".invoice-grand-total")?.textContent).toContain("Grand total");
    expect(doc.body.textContent).not.toContain("Amount Due");
  });
  it("omits zero discounts/tax and supports legacy orders without invoice references", () => {
    const doc = documentFor({ ...order, invoiceNumber: undefined, discountAmount: 0, taxAmount: 0 });
    expect(doc.querySelector(".invoice-totals")?.textContent).not.toContain("Discount");
    expect(doc.querySelector(".invoice-totals")?.textContent).not.toContain("VAT / Tax");
    expect(doc.querySelector(".invoice-reference-grid")?.textContent).toContain(order.orderNumber);
  });
  it("uses each saved tax rate rather than current shop tax settings", () => {
    const doc = documentFor({ ...order, items: [
      ...order.items,
      { ...order.items[0], id: "item-2", taxClassName: "Standard VAT", taxRate: "15" },
    ] });
    expect(doc.body.textContent).toContain("Reduced VAT: 5%");
    expect(doc.body.textContent).toContain("Standard VAT: 15%");
  });
  it("isolates the print copy as a direct body child and restores the page title", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    document.title = "My orders";
    act(() => root!.render(<OrderInvoice order={order} store={store} />));
    expect(document.querySelector("#invoice-print-root")?.parentElement).toBe(document.body);
    act(() => window.dispatchEvent(new Event("beforeprint")));
    expect(document.title).toBe("Invoice-INV-2026-001");
    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(document.title).toBe("My orders");
    act(() => root!.unmount());
    root = undefined;
    expect(document.querySelector("#invoice-print-root")).toBeNull();
  });
  it("renders long orders without losing item rows", () => {
    const longOrder = { ...order, discountAmount: 0, taxAmount: 0, subtotal: "1999.60", grandTotal: "2079.60",
      items: Array.from({ length: 40 }, (_, index) => ({
        id: String(index), productName: "Handwoven Cotton Scarf - " + String(index + 1).padStart(2, "0"),
        sku: "AYR-SCF-" + index, quantity: 1, unitPrice: "49.99", subtotal: "49.99",
      })),
    };
    expect(documentFor(longOrder).querySelectorAll("tbody tr")).toHaveLength(40);
    if (process.env.INVOICE_PREVIEW_PATH) {
      writeFileSync(process.env.INVOICE_PREVIEW_PATH, JSON.stringify({
        short: renderToStaticMarkup(<InvoiceDocument order={order} store={store} />),
        long: renderToStaticMarkup(<InvoiceDocument order={longOrder} store={store} />),
      }));
    }
  });
});
