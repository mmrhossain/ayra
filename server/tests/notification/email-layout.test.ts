import { describe, expect, it } from "vitest";
import {
  buildOrderItemsTable,
  buildOrderSummaryTable,
  escapeHtml,
  getBaseEmailTemplate,
} from "../../src/template/email.ts";
import { ORDER_CONFIRMATION_TEMPLATE } from "../../src/template/order-confirmation.ts";
import { PAYMENT_CONFIRMATION_TEMPLATE } from "../../src/template/payment-confirmation.ts";
import { buildLowStockTable } from "../../src/template/low-stock-alert.ts";
import { SHIPMENT_UPDATE_TEMPLATE } from "../../src/template/shipment-update.ts";
import {
  ORDER_STATUS_MESSAGES,
  ORDER_STATUS_UPDATE_TEMPLATE,
} from "../../src/template/order-status-update.ts";

describe("Email layout", () => {
  it("uses Ayra branding and warm header colors", () => {
    const html = getBaseEmailTemplate({
      title: "Order Confirmed",
      userName: "A",
      message: "Hi",
    });

    expect(html).toContain("Ayra Team");
    expect(html).not.toContain("Rangalay");
    expect(html).not.toContain("Your Company");
    expect(html).toContain("#b08d57");
    expect(html).toContain("Order Confirmed");
    expect(html).toContain("linear-gradient(135deg, #fbf7ef 0%, #efe3cf 100%)");
  });

  it("escapes user-controlled values", () => {
    const html = getBaseEmailTemplate({
      title: "<script>alert(1)</script>",
      userName: '<b>"Sami"</b>',
      message: "Trusted <strong>HTML</strong>",
      buttonText: "<Click>",
      buttonUrl: 'https://example.test/?next="x"',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;Sami&quot;");
    expect(html).toContain("&lt;Click&gt;");
    expect(html).toContain("next=&quot;x&quot;");
    expect(html).toContain("Trusted <strong>HTML</strong>");
  });

  it("uses the supplied footer note", () => {
    const html = getBaseEmailTemplate({
      title: "Reset Your Password",
      message: "Reset",
      footerNote: "If you did not request this, ignore this email.",
    });

    expect(html).toContain("If you did not request this, ignore this email.");
  });

  it("keeps embedded tables inside a fluid message container with a desktop Outlook fallback", () => {
    const html = getBaseEmailTemplate({
      title: "Order Confirmed",
      message: '<table width="100%"><tr><td>Order details</td></tr></table>',
    });
    expect(html).toContain('width="100%" style="width: 100%; max-width: 600px');
    expect(html).toContain('<!--[if mso]><table role="presentation" width="600"');
    expect(html).toMatch(/<div style="margin: 0 0 25px 0;[^>]*>\s*<table/);
    expect(html).toContain("@media screen and (max-width: 480px)");
  });
});

describe("Order email tables", () => {
  it("renders items as a table instead of a line-break list", () => {
    const html = buildOrderItemsTable(
      [
        {
          name: "Silk Panjabi",
          variant: "Maroon / L",
          quantity: 2,
          unitPrice: "1500.00",
          subtotal: "3000.00",
        },
      ],
      "BDT",
    );

    expect(html).toContain('<table role="presentation"');
    expect(html).toContain("Qty");
    expect(html).toContain("Price");
    expect(html).toContain("Total");
    expect(html).toContain("Silk Panjabi");
    expect(html).toContain("Maroon / L");
    expect(html).toContain("BDT 3000.00");
    expect(html).toContain('class="email-data-grid"');
    expect(html).toMatch(/class="email-grid-label"[^>]*>Total: /);
    expect(html).not.toContain("2x ");
  });

  it("gives narrow inventory rows their own field labels", () => {
    const html = buildLowStockTable([
      { productName: "Silk Panjabi", sku: "PANJABI-XL", warehouseName: "Dhaka", quantityAvailable: 0 },
    ]);
    expect(html).toContain('class="email-data-grid"');
    expect(html).toMatch(/class="email-grid-label"[^>]*>SKU: /);
    expect(html).toMatch(/class="email-grid-label"[^>]*>Warehouse: /);
    expect(html).toMatch(/class="email-grid-label"[^>]*>Available: /);
    expect(html).toContain("Out of stock");
  });

  it("escapes product and variant names", () => {
    const html = buildOrderItemsTable(
      [
        {
          name: "Ayra <script>alert(1)</script>",
          variant: "<b>Red</b>",
          quantity: 1,
          unitPrice: "100.00",
          subtotal: "100.00",
        },
      ],
      "BDT",
    );

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;Red&lt;/b&gt;");
  });

  it("renders summary rows with an emphasized total", () => {
    const html = buildOrderSummaryTable([
      { label: "Subtotal", value: "BDT 100.00" },
      { label: "Total", value: "BDT 160.00", emphasis: true },
    ]);

    expect(html).toContain("Subtotal");
    expect(html).toContain("BDT 100.00");
    expect(html).toContain("BDT 160.00");
    expect(html).toContain("font-weight: 700");
  });

  it("escapes standalone values", () => {
    expect(escapeHtml('<a href="x">&\'')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });
});

describe("Transactional email templates", () => {
  it("uses Ayra branding for order and payment emails", () => {
    for (const template of [
      ORDER_CONFIRMATION_TEMPLATE,
      PAYMENT_CONFIRMATION_TEMPLATE,
      SHIPMENT_UPDATE_TEMPLATE,
      ORDER_STATUS_UPDATE_TEMPLATE,
    ]) {
      expect(template.content).toContain("Ayra Team");
      expect(template.content).toContain("#b08d57");
      expect(template.content).not.toContain("Rangalay");
    }
  });

  it("keeps shipment update variables in sync with the tracking link", () => {
    expect(SHIPMENT_UPDATE_TEMPLATE.variables).toContain("trackingUrl");
    expect(SHIPMENT_UPDATE_TEMPLATE.variables).toContain("detailsTable");
    expect(SHIPMENT_UPDATE_TEMPLATE.content).toContain("{{trackingUrl}}");
    expect(SHIPMENT_UPDATE_TEMPLATE.content).toContain("{{detailsTable}}");
    expect(SHIPMENT_UPDATE_TEMPLATE.subject).toContain("{{statusLabel}}");
  });

  it("keeps order status updates aligned with the status message map", () => {
    expect(ORDER_STATUS_UPDATE_TEMPLATE.variables).toContain("statusLabel");
    expect(ORDER_STATUS_UPDATE_TEMPLATE.variables).toContain(
      "statusDescription",
    );
    expect(ORDER_STATUS_UPDATE_TEMPLATE.variables).toContain("orderUrl");
    expect(ORDER_STATUS_UPDATE_TEMPLATE.content).toContain("{{statusLabel}}");
    expect(ORDER_STATUS_UPDATE_TEMPLATE.content).toContain(
      "{{statusDescription}}",
    );
    expect(ORDER_STATUS_MESSAGES.PROCESSING.label).toBe("Processing");
    expect(ORDER_STATUS_MESSAGES.CANCELLED.label).toBe("Cancelled");
    expect(ORDER_STATUS_MESSAGES).not.toHaveProperty("PENDING");
    expect(ORDER_STATUS_MESSAGES).not.toHaveProperty("CONFIRMED");
  });

  it("keeps order confirmation variables in sync with the table renderers", () => {
    expect(ORDER_CONFIRMATION_TEMPLATE.variables).toContain("itemsTable");
    expect(ORDER_CONFIRMATION_TEMPLATE.variables).toContain("summaryTable");
    expect(ORDER_CONFIRMATION_TEMPLATE.variables).not.toContain("items");
    expect(ORDER_CONFIRMATION_TEMPLATE.content).toContain("{{itemsTable}}");
    expect(ORDER_CONFIRMATION_TEMPLATE.content).toContain("{{summaryTable}}");
    expect(ORDER_CONFIRMATION_TEMPLATE.variables).toContain("orderUrl");
    expect(ORDER_CONFIRMATION_TEMPLATE.content).toContain("{{orderUrl}}");
    expect(ORDER_CONFIRMATION_TEMPLATE.content).toContain("View order &amp; tracking");
  });
});
