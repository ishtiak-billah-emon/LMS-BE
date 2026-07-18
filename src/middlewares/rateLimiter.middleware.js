import rateLimit from "express-rate-limit";

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
  forgotPasswordRateLimiter,
};
