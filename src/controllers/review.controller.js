import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {
  createReviewService,
  getCourseReviewsService,
  getReviewByIdService,
  deleteReviewService,
} from "../services/review.service.js";

const createReview = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    throw new ApiError(400, "Rating and comment are required");
  }

  const review = await createReviewService(req.user, courseId, {
    rating,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added successfully"));
});

const getCourseReviews = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const data = await getCourseReviewsService(courseId, page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Reviews fetched successfully"));
});

const getReviewById = AsyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await getReviewByIdService(reviewId);

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review fetched successfully"));
});

const deleteReview = AsyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  await deleteReviewService(req.user, reviewId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

export {
  createReview,
  getCourseReviews,
  getReviewById,
  deleteReview,
};
