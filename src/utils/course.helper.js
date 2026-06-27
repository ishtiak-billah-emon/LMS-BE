import { Course } from "../models/course.model.js";
import { ApiError } from "./ApiError.js";

const findOwnedCourse = async (courseId, currentUser) => {

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const isCourseOwner = course.teacher.equals(currentUser._id);

    if (!isCourseOwner) {
        throw new ApiError(
            403,
            "You are not authorized to modify this course."
        );
    }

    return course;
};

export { findOwnedCourse };


    //     // future
    //     const isAuthorized =
    //     currentUser.role === "owner" ||
    //     currentUser.role === "admin" ||
    //     course.teacher.equals(currentUser._id);

    // if (!isAuthorized) {
    //     throw new ApiError(
    //         403,
    //         "You are not authorized to modify this course."
    //     );
    // }

    