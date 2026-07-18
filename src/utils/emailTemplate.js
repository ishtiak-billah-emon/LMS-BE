// Reusable, responsive HTML email templates with Tutor Time branding.
// Keep inline styles so they render consistently across email clients.

const baseStyles = `
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f1f5f9;
`;

const buttonStyles = `
  display: inline-block;
  background-color: #4f46e5;
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 10px;
`;

export const passwordResetTemplate = ({ resetURL, expiryMinutes = 15 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your Tutor Time password</title>
  </head>
  <body style="${baseStyles}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
            <!-- Header / Branding -->
            <tr>
              <td style="background-color: #4f46e5; padding: 28px 32px; text-align: center;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background-color: #ffffff; color: #4f46e5; font-size: 22px; font-weight: 800;">T</span>
                <div style="margin-top: 12px; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.2px;">Tutor Time</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin: 0 0 12px; font-size: 22px; line-height: 1.3; color: #0f172a;">Reset your password</h1>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                  We received a request to reset your Tutor Time password. Click the button below to choose a new password.
                  This link will expire in <strong>${expiryMinutes} minutes</strong>.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 12px 0 20px;">
                      <a href="${resetURL}" target="_blank" rel="noopener noreferrer" style="${buttonStyles}">Reset Password</a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #64748b;">
                  If the button doesn&apos;t work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 20px; word-break: break-all; font-size: 14px; line-height: 1.6; color: #4f46e5;">
                  <a href="${resetURL}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">${resetURL}</a>
                </p>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                    If you didn&apos;t request a password reset, you can safely ignore this email &mdash; your password will not change and no further action is needed.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Tutor Time. All rights reserved.<br />
                This is an automated message, please do not reply.
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

export default {
  passwordResetTemplate,
};
