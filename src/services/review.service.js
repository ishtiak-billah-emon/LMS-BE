import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Review } from "../models/review.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  bumpCacheVersion,
  deleteCache,
  getCachedJson,
  getCacheVersion,
  setCachedJson,
} from "../utils/cache.js";
import { invalidateCourseCache } from "./course.service.js";

const createReviewService = async (currentUser, courseId, { rating, comment }) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status !== "published") {
    throw new ApiError(400, "You can only review published courses");
  }

  const enrollment = await Enrollment.findOne({
    student: currentUser._id,
    course: courseId,
    isActive: true,
  });

  if (!enrollment) {
    throw new ApiError(403, "You must be enrolled in this course to review it");
  }

  const existingReview = await Review.findOne({
    student: currentUser._id,
    course: courseId,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this course");
  }

  const review = await Review.create({
    student: currentUser._id,
    course: courseId,
    rating: Number(rating),
    comment: comment.trim(),
  });

  await recalculateCourseRating(courseId);
  await invalidateReviewCache(courseId, course.slug);

  return review;
};

const getCourseReviewsService = async (courseId, page = 1, limit = 10) => {
  const version = await getCacheVersion(`review:${courseId}`);
  const cacheKey = `lms:review:course:${courseId}:v${version}:page:${page}:limit:${limit}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) return cached;
  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    Review.find({ course: courseId })
      .populate("student", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ course: courseId }),
  ]);

  const result = {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
  await setCachedJson(cacheKey, result, 120);
  return result;
};

const getReviewByIdService = async (reviewId) => {
  const cacheKey = `lms:review:${reviewId}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) return cached;
  const review = await Review.findById(reviewId).populate(
    "student",
    "fullName avatar"
  );

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await setCachedJson(cacheKey, review.toObject(), 300);

  return review;
};

const deleteReviewService = async (currentUser, reviewId) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const isOwner = review.student.toString() === currentUser._id.toString();
  const course = await Course.findById(review.course);
  const isTeacher = course?.teacher.toString() === currentUser._id.toString();

  if (!isOwner && !isTeacher) {
    throw new ApiError(403, "You are not authorized to delete this review");
  }

  const courseId = review.course;
  await review.deleteOne();

  await recalculateCourseRating(courseId);
  await deleteCache(`lms:review:${reviewId}`);
  await invalidateReviewCache(courseId, course.slug);

  return;
};

const invalidateReviewCache = async (courseId, courseSlug) => {
  await Promise.all([
    bumpCacheVersion(`review:${courseId}`),
    invalidateCourseCache({ slugs: courseSlug ? [courseSlug] : [] }),
  ]);
};

const recalculateCourseRating = async (courseId) => {
  const result = await Review.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const avgRating = result.length > 0 ? result[0].avgRating : 0;
  const totalReviews = result.length > 0 ? result[0].totalReviews : 0;

  await Course.findByIdAndUpdate(courseId, {
    rating: Math.round(avgRating * 10) / 10,
    totalReviews,
  });
};

export {
  createReviewService,
  getCourseReviewsService,
  getReviewByIdService,
  deleteReviewService,
};
