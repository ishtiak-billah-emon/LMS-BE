import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createEnrollmentService, deleteEnrollmentService, getAllEnrollmentsService, updateEnrollmentService } from "../services/enrollment.service.js";


export const getAllEnrollments = AsyncHandler(async (req, res) => {
  const enrollments = await getAllEnrollmentsService(
    req.user,
    req.query.studentId
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, enrollments, "Enrollments fetched successfully.")
    );
});

export const createEnrollment = AsyncHandler(async (req, res) => {
  const { email, courseId, amount } = req.body;

  const enrollment = await createEnrollmentService(
    req.user,
    email,
    courseId,
    amount
  );

  return res
    .status(201)
    .json(new ApiResponse(201, enrollment, "Student enrolled successfully."));
});

export const updateEnrollment = AsyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { amount, isActive } = req.body;

  const enrollment = await updateEnrollmentService(
    req.user,
    enrollmentId,
    amount,
    isActive
  );

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, "Enrollment updated successfully."));
});

export const deleteEnrollment = AsyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;

  await deleteEnrollmentService(req.user, enrollmentId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Enrollment deleted successfully."));
});