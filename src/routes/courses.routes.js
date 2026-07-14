import { Router } from "express";
import {
    createCourse,
    getLesson,
    deleteLesson,
    updateLesson,
    createLesson,
    createSection,
    updateSection,
    deleteSection,
    getCourse,
    changeCourseStatus,
    changeCourseFeatured,
    getCourseById,
    updateCourse,
    getMyCourses,
    getCoursesByTeacher,
    getPublishedCourse,
    getPublishedCourseById,
    getFeaturedCourse,
    deleteCourse,
    markLessonComplete,
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getEnrollmentRequests,
    createEnrollmentRequest,
    updateEnrollmentRequest
} from "../controllers/course.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { optionalVerifyJWT } from "../middlewares/optionalAuth.middleware.js";

const router = Router();

const uploadCourseThumbnail = upload.fields([
    {
        name: "thumbnail",
        maxCount: 1,
    },
]);


// enrollment req
router.get(
  "/enrollment-requests",
  verifyJWT,
  authorizeRoles("admin", "teacher"),
  getEnrollmentRequests
);

router.post(
  "/create-enrollment-request",
  verifyJWT,
  createEnrollmentRequest
);

router.patch(
  "/enrollment-requests/:id",
  verifyJWT,
  authorizeRoles("admin", "teacher"),
  updateEnrollmentRequest
);
// public route 

router.get(
    "/",
    getPublishedCourse
)

router.get(
    "/unpublished",
    getCourse
)
router.get(
    "/featured",
    getFeaturedCourse
)

router.get(
    "/:slug",
    optionalVerifyJWT,
    getPublishedCourseById
)

router.get(
    "/unpublished/:courseId",
    getCourseById
)

// Private Routes

router.get(
    "/teacher/my-courses",
    verifyJWT,
    authorizeRoles("teacher"),
    getMyCourses
);

router.get(
    "/teacher/:teacherId",
    verifyJWT,
    authorizeRoles("teacher", "owner", "admin"),
    getCoursesByTeacher
);

router.post(
    "/create-course",
    verifyJWT,
    authorizeRoles("teacher"),
    uploadCourseThumbnail,
    createCourse
);

router.patch(
    "/:courseId",
    verifyJWT,
    authorizeRoles("teacher"),
    uploadCourseThumbnail,
    updateCourse
);

router.patch(
  "/:courseId/status",
  verifyJWT,
  authorizeRoles("teacher"),
  changeCourseStatus
);

router.patch(
    "/:courseId/featured",
    verifyJWT,
    authorizeRoles("teacher"),
    changeCourseFeatured
);

router.delete(
    "/:courseId",
    verifyJWT,
    authorizeRoles("teacher", "owner"),
    deleteCourse
);

// section

router.post(
    "/:courseId/create-section",
    verifyJWT,
    authorizeRoles("teacher"),
    createSection
);

router.patch(
    "/:courseId/sections/:sectionId",
    verifyJWT,
    authorizeRoles("teacher"),
    updateSection
);

router.delete(
    "/:courseId/sections/:sectionId",
    verifyJWT,
    authorizeRoles("teacher"),
    deleteSection
);

// lesson

// router.get(
//     "/:courseId/sections/:sectionId/lessons/:lessonId",
//     verifyJWT,
//     authorizeRoles("teacher"),
//     getLesson
// );
router.get(
    "/:courseSlug/:lessonSlug",
    verifyJWT,
    getLesson
);

router.post(
    "/:courseId/:sectionId/create-lesson",
    verifyJWT,
    authorizeRoles("teacher"),
    createLesson
);

router.patch(
    "/:courseId/sections/:sectionId/lessons/:lessonId",
    verifyJWT,
    authorizeRoles("teacher"),
    updateLesson
);

router.delete(
    "/:courseId/sections/:sectionId/lessons/:lessonId",
    verifyJWT,
    authorizeRoles("teacher"),
    deleteLesson
);

// resources (nested under lesson)

router.get(
    "/:courseId/sections/:sectionId/lessons/:lessonId/resources",
    verifyJWT,
    authorizeRoles("teacher"),
    getResources
);

router.get(
    "/:courseId/sections/:sectionId/lessons/:lessonId/resources/:resourceId",
    verifyJWT,
    authorizeRoles("teacher"),
    getResourceById
);

router.post(
    "/:courseId/sections/:sectionId/lessons/:lessonId/resources",
    verifyJWT,
    authorizeRoles("teacher"),
    createResource
);

router.patch(
    "/:courseId/sections/:sectionId/lessons/:lessonId/resources/:resourceId",
    verifyJWT,
    authorizeRoles("teacher"),
    updateResource
);

router.delete(
    "/:courseId/sections/:sectionId/lessons/:lessonId/resources/:resourceId",
    verifyJWT,
    authorizeRoles("teacher"),
    deleteResource
);


router.post("/:courseSlug/:lessonSlug/complete", verifyJWT, markLessonComplete);
export default router;