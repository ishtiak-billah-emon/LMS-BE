import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import {
  createCourseService,
  createLessonService,
  createSectionService,
  getCourseByIdService,
  getCoursesByTeacherService,
  getCourseService,
  getPublishedCourseService,
  changeCourseStatusService,
  updateCourseService,
  deleteCourseService,
  deleteLessonService,
  updateLessonService,
  getLessonService,
  deleteSectionService,
  updateSectionService,
  getFeaturedCourseService,
  changeCourseFeatureService,
  getPublishedCourseByIdService,
  markLessonCompleteService,
  getResourcesService,
  getResourceByIdService,
  createResourceService,
  updateResourceService,
  deleteResourceService,
} from "../services/course.service.js";
import enrollmentRequestModel from "../models/enrollmentRequest.model.js";
import { Enrollment } from "../models/enrollment.model.js";

const createCourse = AsyncHandler(async (req, res) => {
  const { title, description, category, price, discountPrice } = req.body;

  // Required field validation
  const requiredFields = [
    { value: title, name: "Title" },
    { value: description, name: "Description" },
    { value: category, name: "Category" },
    { value: price, name: "Price" },
  ];

  requiredFields.forEach((field) => {
    if (field.value === undefined || field.value.toString().trim() === "") {
      throw new ApiError(400, `${field.name} is required`);
    }
  });

  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!thumbnailFile) {
    throw new ApiError(400, "Course thumbnail is required");
  }

  const thumbnailLocalPath = thumbnailFile.path;

  const course = await createCourseService(
    req.user,
    {
      title,
      description,
      category,
      price,
      discountPrice,
    },
    thumbnailLocalPath
  );
  return res
    .status(201)
    .json(new ApiResponse(201, course, "Course created successfully"));
});

const updateCourse = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const thumbnailFile = req.files?.thumbnail?.[0];

  const updatedCourse = await updateCourseService(
    req.user,
    courseId,
    req.body,
    thumbnailFile?.path
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

const getCourse = AsyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const courses = await getCourseService(page, limit);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        course: courses,
      },
      "Get course successfully"
    )
  );
});

const getCourseById = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await getCourseByIdService(courseId);
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Get course successfully By Id"));
});

const getMyCourses = AsyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const result = await getCoursesByTeacherService(req.user._id, page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Courses fetched successfully."));
});

const getCoursesByTeacher = AsyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const result = await getCoursesByTeacherService(teacherId, page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Courses fetched successfully."));
});

const getFeaturedCourse = AsyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const courses = await getFeaturedCourseService(page, limit);
  return res
    .status(200)
    .json(new ApiResponse(200, courses, "Get published courses successfully"));
});

const getPublishedCourse = AsyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const courses = await getPublishedCourseService(page, limit);
  return res
    .status(200)
    .json(new ApiResponse(200, courses, "Get published courses successfully"));
});

const getPublishedCourseById = AsyncHandler(async (req, res) => {
  const { slug } = req.params;

  const data = await getPublishedCourseByIdService(req.user, req.params.slug);

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Get published courses successfully By Slug")
    );
});

const changeCourseStatus = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required.");
  }

  const course = await changeCourseStatusService(req.user, courseId, status);

  return res
    .status(200)
    .json(new ApiResponse(200, course, `Course ${status} successfully.`));
});

const changeCourseFeatured = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { isFeatured } = req.body;

  if (isFeatured === undefined || isFeatured === null || isFeatured === "") {
    throw new ApiError(400, "isFeatured is required.");
  }

  const course = await changeCourseFeatureService(
    req.user,
    courseId,
    isFeatured
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        course,
        `Course ${course.isFeatured ? "marked as featured" : "unfeatured"} successfully.`
      )
    );
});

const deleteCourse = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;

  await deleteCourseService(req.user, courseId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Course deleted successfully."));
});

const createSection = AsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title } = req.body;
  if (!title || title.trim() === "") {
    throw new ApiError(400, "Section title is required");
  }
  const updatedCourse = await createSectionService(req.user, courseId, title);

  return res
    .status(201)
    .json(new ApiResponse(201, updatedCourse, "Section created successfully"));
});
const updateSection = AsyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const { title } = req.body;

  if (!title || title.trim() === "") {
    throw new ApiError(400, "Section title is required.");
  }

  const section = await updateSectionService(
    req.user,
    courseId,
    sectionId,
    title
  );

  return res
    .status(200)
    .json(new ApiResponse(200, section, "Section updated successfully."));
});
const deleteSection = AsyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;

  await deleteSectionService(req.user, courseId, sectionId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Section deleted successfully."));
});

const createLesson = AsyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const { title, videoUrl, duration, preview } = req.body;

  const requiredFields = [
    { value: title, name: "Title" },
    { value: videoUrl, name: "Video URL" },
    { value: duration, name: "Duration" },
    { value: preview, name: "preview" },
  ];

  requiredFields.forEach((field) => {
    if (field.value === undefined || field.value.toString().trim() === "") {
      throw new ApiError(400, `${field.name} is required`);
    }
  });

  // Duration validation (seconds)
  if (!Number.isInteger(Number(duration)) || Number(duration) <= 0) {
    throw new ApiError(400, "Duration must be a positive integer in seconds.");
  }

  // Preview validation (optional)
  if (preview !== undefined && typeof preview !== "boolean") {
    throw new ApiError(400, "Preview must be a boolean value.");
  }

  // service called

  const updatedCourse = await createLessonService(
    req.user,
    courseId,
    sectionId,
    title,
    videoUrl,
    duration,
    preview
  );

  return res
    .status(201)
    .json(new ApiResponse(201, updatedCourse, "Lesson created successfully"));
});

const getLesson = AsyncHandler(async (req, res) => {
  const { courseSlug, lessonSlug } = req.params;

  const data = await getLessonService(req.user, courseSlug, lessonSlug);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Lesson fetched successfully."));
});

const updateLesson = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId } = req.params;

  const { title, videoUrl, duration, preview } = req.body;

  const lesson = await updateLessonService(
    req.user,
    courseId,
    sectionId,
    lessonId,
    {
      title,
      videoUrl,
      duration,
      preview,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, lesson, "Lesson updated successfully."));
});

const deleteLesson = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId } = req.params;

  await deleteLessonService(req.user, courseId, sectionId, lessonId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Lesson deleted successfully."));
});

const markLessonComplete = AsyncHandler(async (req, res) => {
  const { courseSlug, lessonSlug } = req.params;

  const enrollment = await markLessonCompleteService(
    req.user,
    courseSlug,
    lessonSlug
  );

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, "Lesson marked as completed."));
});

const getResources = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId } = req.params;

  const data = await getResourcesService(
    req.user,
    courseId,
    sectionId,
    lessonId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Resources fetched successfully."));
});

const getResourceById = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId, resourceId } = req.params;

  const data = await getResourceByIdService(
    req.user,
    courseId,
    sectionId,
    lessonId,
    resourceId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Resource fetched successfully."));
});

const createResource = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId } = req.params;
  const { title, fileUrl } = req.body;

  const requiredFields = [
    { value: title, name: "Title" },
    { value: fileUrl, name: "File URL" },
  ];

  requiredFields.forEach((field) => {
    if (field.value === undefined || field.value.toString().trim() === "") {
      throw new ApiError(400, `${field.name} is required`);
    }
  });

  const resource = await createResourceService(
    req.user,
    courseId,
    sectionId,
    lessonId,
    title,
    fileUrl
  );

  return res
    .status(201)
    .json(new ApiResponse(201, resource, "Resource created successfully"));
});

const updateResource = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId, resourceId } = req.params;

  const { title, fileUrl } = req.body;

  const resource = await updateResourceService(
    req.user,
    courseId,
    sectionId,
    lessonId,
    resourceId,
    { title, fileUrl }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, resource, "Resource updated successfully."));
});

const deleteResource = AsyncHandler(async (req, res) => {
  const { courseId, sectionId, lessonId, resourceId } = req.params;

  await deleteResourceService(
    req.user,
    courseId,
    sectionId,
    lessonId,
    resourceId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource deleted successfully."));
});

const createEnrollmentRequest = async (req, res) => {
  const { courseId, email, paymentMethod, transactionId, amount, note } =
    req.body;

  const request = await enrollmentRequestModel.create({
    student: req.user.id,
    course: courseId,
    email,
    paymentMethod,
    transactionId,
    amount,
    note,
  });

  res.status(201).json({
    success: true,
    data: request,
  });
};

export const getEnrollmentRequests = async (req, res) => {
  console.log("INSIDE getEnrollmentRequests");
  const requests = await enrollmentRequestModel
    .find()
    .populate("student", "name email")
    .populate("course", "title")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: requests,
  });
};

export const updateEnrollmentRequest = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const request = await enrollmentRequestModel.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Request not found",
    });
  }

  if (request.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Request already processed",
    });
  }

  if (status === "approved") {
    const existingEnrollment = await Enrollment.findOne({
      student: request.student,
      course: request.course,
    });

    if (!existingEnrollment) {
      await Enrollment.create({
        student: request.student,
        course: request.course,
        totalAmount: request.amount,
      });
    }

    request.status = "approved";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
  }

  if (status === "rejected") {
    request.status = "rejected";
    request.rejectionReason = rejectionReason || "";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
  }

  await request.save();

  res.status(200).json({
    success: true,
    message: `Request ${status}`,
    data: request,
  });
};
export {
  getCourse,
  getCourseById,
  getMyCourses,
  getCoursesByTeacher,
  getPublishedCourse,
  getPublishedCourseById,
  getFeaturedCourse,
  changeCourseFeatured,
  createCourse,
  updateCourse,
  deleteCourse,
  changeCourseStatus,
  createSection,
  updateSection,
  deleteSection,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  markLessonComplete,
  createEnrollmentRequest,
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
