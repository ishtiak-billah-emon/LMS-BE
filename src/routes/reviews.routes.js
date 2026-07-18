import { Router } from "express";
import {
  createReview,
  getCourseReviews,
  getReviewById,
  deleteReview,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { optionalVerifyJWT } from "../middlewares/optionalAuth.middleware.js";

const router = Router();

router.get(
  "/course/:courseId",
  optionalVerifyJWT,
  getCourseReviews
);

router.get(
  "/:reviewId",
  optionalVerifyJWT,
  getReviewById
);

router.post(
  "/course/:courseId",
  verifyJWT,
  createReview
);

router.delete(
  "/:reviewId",
  verifyJWT,
  deleteReview
);

export default router;
