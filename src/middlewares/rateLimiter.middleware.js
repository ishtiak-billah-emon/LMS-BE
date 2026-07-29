import rateLimit from "express-rate-limit";

// Limits failed sign-in attempts per IP to slow down password-guessing attacks.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again in 15 minutes.",
  },
});

// Protects the forgot-password endpoint from abuse / enumeration attempts.
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

export default {
  loginRateLimiter,
  forgotPasswordRateLimiter,
};
