import nodemailer from "nodemailer";
import { ApiError } from "../utils/ApiError.js";
import { passwordResetTemplate } from "../utils/emailTemplate.js";

// Reusable transporter configured for Brevo SMTP. Credentials are read from
// environment variables and are never logged. The transporter is created
// lazily on first use so it always reflects the current environment (and is
// resilient to config/load-order issues).
let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // TLS on port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const defaultFrom = process.env.EMAIL_FROM || "ishtiakemon2002@gmail.com";

// Low-level send method reused by every future email type
// (verification, enrollment, certificates, etc.).
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || !html) {
    throw new ApiError(400, "Email recipient, subject and body are required");
  }

  try {
    return await getTransporter().sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    // Never leak SMTP credentials or tokens to the client, but log the real
    // provider error server-side so delivery failures are diagnosable.
    console.error(
      "[email] send failed:",
      error?.response || error?.message || error
    );
    throw new ApiError(500, "Failed to send email. Please try again later.");
  }
};

export const sendPasswordResetEmail = async ({ email, resetURL }) => {
  const html = passwordResetTemplate({ resetURL, expiryMinutes: 15 });

  return sendEmail({
    to: email,
    subject: "Reset your Tutor Time password",
    html,
    text: `Reset your Tutor Time password by visiting: ${resetURL}\nThis link expires in 15 minutes. If you didn't request this, you can ignore this email.`,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
};
