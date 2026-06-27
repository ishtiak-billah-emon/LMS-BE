import { Router } from "express";
import { createCourse, createLesson, createSection, getCourse, getCourseById, updateCourse } from "../controllers/course.controller.js";
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
    getCourse
)
router.get(
    "/:courseId",
    getCourseById
)

// Private Routes
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

router.post(
    "/:courseId/create-section",
    verifyJWT,
    authorizeRoles("teacher"),
    createSection
);
router.post(
    "/:courseId/:sectionId/create-lesson",
    verifyJWT,
    authorizeRoles("teacher"),
    createLesson
);

export default router;