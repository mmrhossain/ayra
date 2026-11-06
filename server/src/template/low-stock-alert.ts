import { escapeHtml, getBaseEmailTemplate } from "./email.ts";

export const LOW_STOCK_ALERT_CODE = "LOW_STOCK_ALERT";

export type LowStockAlertItem = {
  productName: string;
  sku: string;
  warehouseName: string;
  quantityAvailable: number;
};

export const buildLowStockTable = (items: LowStockAlertItem[]): string => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="border-collapse: collapse; margin: 8px 0 20px 0; font-size: 14px;">
    <thead>
      <tr style="background-color: #f7f3ea;">
        <th align="left" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Product</th>
        <th align="left" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">SKU</th>
        <th align="left" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Warehouse</th>
        <th align="right" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Available</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map((item) => {
          const outOfStock = item.quantityAvailable <= 0;
          const badgeColor = outOfStock ? "#b3261e" : "#9a6b1f";
          const badgeBackground = outOfStock ? "#fbe9e7" : "#fdf3df";
          return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #4b4438;">
            <strong style="color: #3f3629;">${escapeHtml(item.productName)}</strong>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #6f675a;">${escapeHtml(item.sku)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #6f675a;">${escapeHtml(item.warehouseName)}</td>
          <td align="right" style="padding: 10px 8px; border-bottom: 1px solid #f0e9da;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: ${badgeColor}; background-color: ${badgeBackground};">
              ${outOfStock ? "Out of stock" : `${item.quantityAvailable} left`}
            </span>
          </td>
        </tr>
      `;
        })
        .join("")}
    </tbody>
  </table>
`;

export const LOW_STOCK_ALERT_TEMPLATE = {
  code: LOW_STOCK_ALERT_CODE,
  name: "Low Stock Alert",
  channel: "EMAIL" as const,
  subject: "Low stock alert: {{itemCount}} item(s) need restocking",
  content: getBaseEmailTemplate({
    title: "Low stock alert",
    userName: "{{adminName}}",
    message:
      "The following items have dropped below the low stock threshold of <strong>{{threshold}}</strong>.<br/><br/>{{itemsTable}}Restock them to keep the storefront up to date.",
    buttonText: "Review inventory",
    buttonUrl: "{{inventoryUrl}}",
    footerNote:
      "You are receiving this because you are an administrator of the store.",
  }),
  variables: [
    "adminName",
    "itemCount",
    "threshold",
    "itemsTable",
    "inventoryUrl",
  ],
};
