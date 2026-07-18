import crypto from "crypto";

import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Payment } from "../models/payment.model.js";
import { Enrollment } from "../models/enrollment.model.js";

import { ApiError } from "../utils/ApiError.js";

// services/enrollment.service.js

export const getAllEnrollmentsService = async (currentUser, studentId) => {
  const role = currentUser.role?.toLowerCase();

  const filter = {};

  if (role === "student") {
    // Students can only see their own enrollments
    filter.student = currentUser._id;
  } else if (!["teacher", "admin", "owner"].includes(role)) {
    throw new ApiError(403, "Unauthorized.");
  } else if (studentId) {
    // Teachers/admins may optionally filter by a specific student
    filter.student = studentId;
  }

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "student",
      select: "email",
    })
    .populate({
      path: "course",
      select: "title slug sections",
    })
    .sort({ createdAt: -1 });

  return enrollments.map((enrollment) => {
    const course = enrollment.course;
    const sections = course?.sections || [];

    // Lookup of lesson id -> duration (seconds) for fast summation.
    const durationById = {};
    let totalLessons = 0;

    for (const section of sections) {
      for (const lesson of section.lessons || []) {
        durationById[lesson._id?.toString()] = lesson.duration || 0;
        totalLessons += 1;
      }
    }

    // Sum durations of completed lessons only.
    let completedDurationSeconds = 0;

    for (const completion of enrollment.completedLessons || []) {
      const lessonId = completion.lesson?.toString?.() || completion.toString?.();
      completedDurationSeconds += durationById[lessonId] || 0;
    }

    return {
      _id: enrollment._id,
      studentEmail: enrollment.student?.email,
      studentId: enrollment.student?._id,
      courseTitle: course?.title,
      courseSlug: course?.slug,
      courseId: course?._id,
      totalAmount: enrollment.totalAmount,
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons?.length ?? 0,
      completedDurationSeconds,
      totalLessons,
      isActive: enrollment.isActive,
      createdAt: enrollment.createdAt,
    };
  });
};

export const createEnrollmentService = async (
  currentUser,
  email,
  courseId,
  amount
) => {
  // Authorization
  if (!["teacher", "admin", "owner"].includes(currentUser.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  // Validation
  if (!email || !courseId || amount === undefined) {
    throw new ApiError(400, "Email, course and amount are required.");
  }

  if (amount < 0) {
    throw new ApiError(400, "Amount cannot be negative.");
  }

  // Find Student
  const student = await User.findOne({
    email: email.trim().toLowerCase(),
    role: "student",
  });

  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  // Find Course
  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found.");
  }

  // Prevent duplicate enrollment
  const existingEnrollment = await Enrollment.findOne({
    student: student._id,
    course: course._id,
  });

  if (existingEnrollment) {
    throw new ApiError(400, "Student is already enrolled in this course.");
  }

  // Create Enrollment
  const enrollment = await Enrollment.create({
    student: student._id,
    course: course._id,
    totalAmount: amount,
    progress: 0,
    completedLessons: [],
    isActive: true,
  });

  return await Enrollment.findById(enrollment._id)
    .populate("student", "fullName email")
    .populate("course", "title")
    .populate("payment");
};

export const updateEnrollmentService = async (
  currentUser,
  enrollmentId,
  amount,
  isActive
) => {
  if (!["teacher", "admin", "owner"].includes(currentUser.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found.");
  }

  if (amount !== undefined) {
    if (amount < 0) {
      throw new ApiError(400, "Amount cannot be negative.");
    }

    enrollment.totalAmount = amount;

    await Payment.findByIdAndUpdate(enrollment.payment, {
      totalAmount: amount,
    });
  }

  if (typeof isActive === "boolean") {
    enrollment.isActive = isActive;
  }

  await enrollment.save();

  return await Enrollment.findById(enrollment._id)
    .populate("student", "fullName email")
    .populate("course", "title")
    .populate("payment");
};

// Returns lessons the student completed since the start of the current day,
// with course/lesson details so the dashboard can render "Today's activity".
export const getTodayActivityService = async (currentUser) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const enrollments = await Enrollment.find({
    student: currentUser._id,
    "completedLessons.completedAt": { $gte: startOfToday },
  })
    .populate({
      path: "course",
      select: "title slug sections",
    })
    .lean();

  const items = [];

  for (const enrollment of enrollments) {
    const course = enrollment.course;

    if (!course) continue;

    for (const completion of enrollment.completedLessons || []) {
      const completedAt = completion.completedAt
        ? new Date(completion.completedAt)
        : null;

      if (!completedAt || completedAt < startOfToday) continue;

      let lessonTitle = "Lesson";
      let lessonSlug = null;

      for (const section of course.sections || []) {
        const lesson = (section.lessons || []).find(
          (l) => l._id?.toString() === completion.lesson?.toString()
        );

        if (lesson) {
          lessonTitle = lesson.title;
          lessonSlug = lesson.slug;
          break;
        }
      }

      items.push({
        courseTitle: course.title,
        courseSlug: course.slug,
        lessonTitle,
        lessonSlug,
        completedAt: completedAt.toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return items;
};

// Local YYYY-MM-DD key (uses local date parts to avoid timezone off-by-one).
const toDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Aggregates lesson completions into a per-day map (last 365 days) and derives
// consistency stats (streaks, active days, best day) for the dashboard's
// learning-history view.
export const getLearningHistoryService = async (currentUser) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(end.getDate() - 364);
  start.setHours(0, 0, 0, 0);

  const enrollments = await Enrollment.find({
    student: currentUser._id,
    "completedLessons.completedAt": { $gte: start },
  }).lean();

  const daily = {};
  let totalLessons = 0;

  for (const enrollment of enrollments) {
    for (const completion of enrollment.completedLessons || []) {
      const completedAt = completion.completedAt
        ? new Date(completion.completedAt)
        : null;

      if (!completedAt || completedAt < start || completedAt > end) continue;

      const key = toDayKey(completedAt);
      daily[key] = (daily[key] || 0) + 1;
      totalLessons += 1;
    }
  }

  const activeDays = Object.keys(daily).length;

  // Longest streak: longest run of consecutive active days in the range.
  let longestStreak = 0;
  let run = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (daily[toDayKey(cursor)] > 0) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Current streak: consecutive active days ending today (or yesterday, so an
  // unfinished today doesn't break an otherwise ongoing streak).
  let currentStreak = 0;
  const streakCursor = new Date(end);
  streakCursor.setHours(0, 0, 0, 0);
  if (!(daily[toDayKey(streakCursor)] > 0)) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while (streakCursor >= start && daily[toDayKey(streakCursor)] > 0) {
    currentStreak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  let bestDay = { date: null, count: 0 };
  for (const [date, count] of Object.entries(daily)) {
    if (count > bestDay.count) bestDay = { date, count };
  }

  const avgPerActiveDay = activeDays
    ? Math.round((totalLessons / activeDays) * 10) / 10
    : 0;

  return {
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    daily,
    totalLessons,
    activeDays,
    currentStreak,
    longestStreak,
    bestDay,
    avgPerActiveDay,
  };
};

export const deleteEnrollmentService = async (currentUser, enrollmentId) => {
  if (!["teacher", "admin", "owner"].includes(currentUser.role)) {
    throw new ApiError(403, "Unauthorized.");
  }

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found.");
  }

  // Delete payment record
  if (enrollment.payment) {
    await Payment.findByIdAndDelete(enrollment.payment);
  }

  // Delete enrollment
  await Enrollment.findByIdAndDelete(enrollmentId);
};
