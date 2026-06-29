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
    getCourseById,
    updateCourse,
    getMyCourses,
    getCoursesByTeacher,
    getPublishedCourse,
    getPublishedCourseById,
    deleteCourse
} from "../controllers/course.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

const uploadCourseThumbnail = upload.fields([
    {
        name: "thumbnail",
        maxCount: 1,
    },
]);

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
    "/:courseId",
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
    authorizeRoles("owner", "admin"),
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

router.get(
    "/:courseId/sections/:sectionId/lessons/:lessonId",
    verifyJWT,
    authorizeRoles("teacher"),
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
export default router;