export interface EmailLayoutOptions {
  title: string;
  userName?: string | null | undefined;
  message: string;
  buttonText?: string | undefined;
  buttonUrl?: string | undefined;
  otpCode?: string | undefined;
  footerNote?: string | undefined;
}

export type EmailOrderItem = {
  name: string;
  variant?: string | null;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

export type EmailSummaryRow = {
  label: string;
  value: string;
  emphasis?: boolean;
};

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPE[char] ?? char);

const escapeAttribute = (value: string): string => escapeHtml(value);

const DEFAULT_FOOTER_NOTE =
  "Questions? Reply to this email and our team will help.";

export const buildOrderItemsTable = (
  items: EmailOrderItem[],
  currency: string,
): string => `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="border-collapse: collapse; margin: 8px 0 20px 0; font-size: 14px;">
    <thead>
      <tr style="background-color: #f7f3ea;">
        <th align="left" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Item</th>
        <th align="center" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Qty</th>
        <th align="right" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Price</th>
        <th align="right" style="padding: 10px 8px; color: #3f3629; font-weight: 600; border-bottom: 1px solid #e8dfcb;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #4b4438;">
            <strong style="color: #3f3629;">${escapeHtml(item.name)}</strong>
            ${
              item.variant
                ? `<br/><span style="font-size: 12px; color: #8a8172;">${escapeHtml(item.variant)}</span>`
                : ""
            }
          </td>
          <td align="center" style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #4b4438;">${item.quantity}</td>
          <td align="right" style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #4b4438;">${escapeHtml(currency)} ${escapeHtml(item.unitPrice)}</td>
          <td align="right" style="padding: 10px 8px; border-bottom: 1px solid #f0e9da; color: #3f3629; font-weight: 600;">${escapeHtml(currency)} ${escapeHtml(item.subtotal)}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
`;

export const buildOrderSummaryTable = (rows: EmailSummaryRow[]): string => `
  <table role="presentation" width="100%" style="border-collapse: collapse; margin: 0 0 20px 0; font-size: 14px;">
    ${rows
      .map((row) => {
        const color = row.emphasis ? "#3f3629" : "#6f675a";
        const weight = row.emphasis ? "700" : "400";
        return `
      <tr>
        <td align="left" style="padding: 4px 0; color: ${color}; font-weight: ${weight};">${escapeHtml(row.label)}</td>
        <td align="right" style="padding: 4px 0; color: ${color}; font-weight: ${weight};">${escapeHtml(row.value)}</td>
      </tr>
    `;
      })
      .join("")}
  </table>
`;

export const getBaseEmailTemplate = ({
  title,
  userName,
  message,
  buttonText,
  buttonUrl,
  otpCode,
  footerNote,
}: EmailLayoutOptions): string => {
  const safeTitle = escapeHtml(title);
  const safeUserName = escapeHtml(userName || "there");
  const safeFooterNote = escapeHtml(footerNote ?? DEFAULT_FOOTER_NOTE);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeTitle}</title>
      <style>
        @media (max-width: 600px) {
          .email-outer { padding: 20px 12px !important; }
          .email-content { padding: 28px 20px !important; }
          .email-header { padding: 26px 20px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f3ea; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f3ea; padding: 40px 0;" class="email-outer">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px; background-color: #fffdf8; border: 1px solid #e8dfcb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(63, 54, 41, 0.06);">

              <tr>
                <td class="email-header" style="background-color: #f3ead9; background-image: linear-gradient(135deg, #fbf7ef 0%, #efe3cf 100%); padding: 32px 30px; border-bottom: 1px solid #e8dfcb;">
                  <p style="margin: 0 0 8px 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #b08d57; font-weight: 700;">AYRA</p>
                  <h1 style="margin: 0; font-size: 22px; line-height: 1.3; font-weight: 600; color: #3f3629;">${safeTitle}</h1>
                </td>
              </tr>

              <tr>
                <td class="email-content" style="padding: 40px 30px; color: #4b4438;">
                  <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.65; color: #4b4438;">
                    Hi <strong>${safeUserName}</strong>,
                  </p>
                  <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.65; color: #4b4438;">
                    ${message}
                  </p>

                  ${
                    otpCode
                      ? `
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 10px 0 25px 0;">
                        <div style="background-color: #f7f3ea; color: #3f3629; padding: 14px 28px; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 6px; display: inline-block; border: 1px dashed #d9c8a6;">
                          ${escapeHtml(otpCode)}
                        </div>
                      </td>
                    </tr>
                  </table>
                  `
                      : ""
                  }

                  ${
                    buttonText && buttonUrl
                      ? `
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 10px 0 25px 0;">
                        <a href="${escapeAttribute(buttonUrl)}" target="_blank" style="background-color: #b08d57; color: #fffdf8; padding: 14px 30px; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block;">
                          ${escapeHtml(buttonText)}
                        </a>
                      </td>
                    </tr>
                  </table>
                  `
                      : ""
                  }

                  <p style="margin: 20px 0 10px 0; font-size: 13px; color: #8a8172; line-height: 1.6;">
                    ${safeFooterNote}
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #4b4438; line-height: 1.6;">
                    Best regards,<br><strong style="color: #3f3629;">Ayra Team</strong>
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="background-color: #f7f3ea; padding: 20px; border-top: 1px solid #e8dfcb;">
                  <p style="margin: 0; font-size: 12px; color: #8a8172;">
                    &copy; ${new Date().getFullYear()} Ayra. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
