export interface EmailLayoutOptions {
    title: string;
    userName?: string | null | undefined;
    message: string;
    buttonText?: string | undefined;
    buttonUrl?: string | undefined;
    otpCode?: string | undefined;
}

export const getBaseEmailTemplate = ({
                                         title,
                                         userName,
                                         message,
                                         buttonText,
                                         buttonUrl,
                                         otpCode,
                                     }: EmailLayoutOptions): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              
              <!-- Header Section -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 35px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">${title}</h1>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px; color: #374151;">
                  <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Hi <strong>${userName || 'there'}</strong>,
                  </p>
                  <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    ${message}
                  </p>

                  <!-- Optional OTP Box -->
                  ${
        otpCode
            ? `
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0 25px 0;">
                          <div style="background-color: #f3f4f6; color: #1f2937; padding: 14px 28px; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 6px; display: inline-block; border: 1px dashed #d1d5db;">
                            ${otpCode}
                          </div>
                        </td>
                      </tr>
                    </table>
                  `
            : ''
    }

                  <!-- Optional Button -->
                  ${
        buttonText && buttonUrl
            ? `
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0 25px 0;">
                          <a href="${buttonUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
                            ${buttonText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  `
            : ''
    }

                  <p style="margin: 20px 0 10px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                    If you did not request this, please ignore this email or contact support.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                    Best regards,<br><strong>Rangalay Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer Section -->
              <tr>
                <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
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