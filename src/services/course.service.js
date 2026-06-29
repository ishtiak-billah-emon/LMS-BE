import slugify from "slugify";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { findOwnedCourse } from "../utils/course.helper.js";
import { findSection } from "../utils/section.helper.js";
import mongoose from "mongoose";


// main course 

const createCourseService = async (
    currentUser,
    courseData,
    thumbnailLocalPath
) => {

    const {
        title,
        description,
        category,
        price,
        discountPrice = 0,
    } = courseData;

    // ----------------------------------
    // Generate Slug
    // ----------------------------------

    const slug = slugify(title, {
        lower: true,
        strict: true,
        trim: true,
    });

    // ----------------------------------
    // Duplicate Slug Check
    // ----------------------------------

    const courseExists = await Course.findOne({ slug });

    if (courseExists) {
        throw new ApiError(
            409,
            "A course with this title already exists."
        );
    }

    // ----------------------------------
    // Upload Thumbnail
    // ----------------------------------

    const uploadedThumbnail =
        await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedThumbnail?.secure_url) {
        throw new ApiError(
            500,
            "Failed to upload course thumbnail."
        );
    }

    // ----------------------------------
    // Create Course
    // ----------------------------------

    const course = await Course.create({

        title: title.trim(),

        slug,

        description: description.trim(),

        thumbnail: uploadedThumbnail.secure_url,

        teacher: currentUser._id,

        category: category.trim(),

        price: Number(price),

        discountPrice: Number(discountPrice) || 0,

    });

    return course;

};

const getPublishedCourseService = async (page = 1, limit = 12) => {

    const skip = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
        Course.find({
            status: "published"
        })
            .select(
                "title slug thumbnail teacher category price discountPrice averageRating totalStudents"
            )
            .populate("teacher", "fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Course.countDocuments({status: "published"})
    ]);

    return {
        courses,
        pagination: {
            page,
            limit,
            totalCourses,
            totalPages: Math.ceil(totalCourses / limit),
        },
    };
};

const getCourseService = async (page = 1, limit = 12) => {

    const skip = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
        Course.find({})
            .select(
                "title slug thumbnail teacher category price discountPrice averageRating totalStudents"
            )
            .populate("teacher", "fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Course.countDocuments({})
    ]);

    return {
        courses,
        pagination: {
            page,
            limit,
            totalCourses,
            totalPages: Math.ceil(totalCourses / limit),
        },
    };
};

const getPublishedCourseByIdService = async (courseId) => {

    const course = await Course.findOne({
        _id: courseId,
        status: "published",
    })
        .populate("teacher", "fullName avatar bio")
        .lean();

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return course;
};

const getCourseByIdService = async (courseId) => {

    const course = await Course.findOne({
        _id: courseId,
    })
        .populate("teacher", "fullName avatar bio")
        .lean();

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return course;
};

const getCoursesByTeacherService = async (
    teacherId,
    page = 1,
    limit = 12
) => {

    const skip = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([

        Course.find({
            teacher: teacherId
        })
        .select(
            "title thumbnail category price discountPrice status createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

        Course.countDocuments({
            teacher: teacherId
        })

    ]);

    return {
        courses,
        pagination: {
            page,
            limit,
            totalCourses,
            totalPages: Math.ceil(totalCourses / limit),
        }
    };
};

const updateCourseService = async (
    currentUser,
    courseId,
    courseData,
    thumbnailLocalPath
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    let isUpdated = false;

    // -------------------------
    // Title + Slug
    // -------------------------

    if (
        courseData.title !== undefined &&
        courseData.title.trim() !== course.title
    ) {

        const title = courseData.title.trim();

        const slug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
        });

        const existingCourse =
            await Course.findOne({
                slug,
                _id: { $ne: courseId },
            });

        if (existingCourse) {
            throw new ApiError(
                409,
                "A course with this title already exists."
            );
        }

        course.title = title;
        course.slug = slug;
        isUpdated = true;
    }

    // -------------------------
    // Description
    // -------------------------

    if (
        courseData.description !== undefined &&
        courseData.description.trim() !== course.description
    ) {
        course.description =
            courseData.description.trim();

        isUpdated = true;
    }

    // -------------------------
    // Category
    // -------------------------

    if (
        courseData.category !== undefined &&
        courseData.category.trim() !== course.category
    ) {
        course.category =
            courseData.category.trim();

        isUpdated = true;
    }

    // -------------------------
    // Price
    // -------------------------

    if (
        courseData.price !== undefined &&
        Number(courseData.price) !== course.price
    ) {

        course.price = Number(courseData.price);

        isUpdated = true;
    }

    // -------------------------
    // Discount Price
    // -------------------------

    if (
        courseData.discountPrice !== undefined &&
        Number(courseData.discountPrice) !==
            course.discountPrice
    ) {

        course.discountPrice =
            Number(courseData.discountPrice);

        isUpdated = true;
    }

    // -------------------------
    // Thumbnail
    // -------------------------

    if (thumbnailLocalPath) {

        const uploadedThumbnail =
            await uploadOnCloudinary(
                thumbnailLocalPath
            );

        if (!uploadedThumbnail?.secure_url) {
            throw new ApiError(
                500,
                "Failed to upload course thumbnail."
            );
        }

        course.thumbnail =
            uploadedThumbnail.secure_url;

        isUpdated = true;
    }

    // -------------------------
    // Nothing Changed
    // -------------------------

    if (!isUpdated) {
        throw new ApiError(
            400,
            "No changes detected."
        );
    }

    await course.save();

    return course;
};

const deleteCourseService = async (
    currentUser,
    courseId
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    if (course.thumbnail) {
        await deleteFromCloudinary(course.thumbnail);
    }
    await course.deleteOne();

    return;
};

const changeCourseStatusService = async (
    currentUser,
    courseId,
    status
) => {

    // Allow only valid statuses
    const allowedStatuses = [
        "draft",
        "published",
    ];

    if (!allowedStatuses.includes(status)) {
        throw new ApiError(
            400,
            "Invalid course status."
        );
    }

    // Authorization
    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    // Already in same status
    if (course.status === status) {
        throw new ApiError(
            400,
            `Course is already ${status}.`
        );
    }

    // Optional validation before publishing
    if (status === "published") {

        if (!course.thumbnail) {
            throw new ApiError(
                400,
                "Thumbnail is required before publishing."
            );
        }

        if (!course.description) {
            throw new ApiError(
                400,
                "Description is required before publishing."
            );
        }

        if (course.sections.length === 0) {
            throw new ApiError(
                400,
                "Add at least one section before publishing."
            );
        }

        const hasLesson = course.sections.some(
            section => section.lessons.length > 0
        );

        if (!hasLesson) {
            throw new ApiError(
                400,
                "Add at least one lesson before publishing."
            );
        }
    }

    course.status = status;

    await course.save();

    return course;
};

const createSectionService = async (
    currentUser,
    courseId,
    title
) => {

    const course = await findOwnedCourse(courseId, currentUser);

    // check duplicate section
    const normalizedTitle = title.trim().toLowerCase();
    const sectionAlreadyExists = course.sections.some(
        section =>
            section.title.toLowerCase() === normalizedTitle
    );

    if (sectionAlreadyExists) {
        throw new ApiError(409, "Section title already exists")
    }

    // get order
    const maxOrder = course.sections.reduce(
        (max, section) => Math.max(max, section.order),
        0
    );

    const order = maxOrder + 1;

    // fix order 
    course.sections.push({
        title: title.trim(),
        order,
    });

    // await course.save({validateBeforeSave:false})
    await course.save();

    return course;
}
const updateSectionService = async (
    currentUser,
    courseId,
    sectionId,
    title
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    const section = findSection(
        course,
        sectionId
    );

    const normalizedTitle =
        title.trim().toLowerCase();

    const duplicateSection =
        course.sections.some(
            sec =>
                sec._id.toString() !== sectionId &&
                sec.title.trim().toLowerCase() === normalizedTitle
        );

    if (duplicateSection) {
        throw new ApiError(
            409,
            "Section title already exists."
        );
    }

    if (section.title === title.trim()) {
        throw new ApiError(
            400,
            "No changes detected."
        );
    }

    section.title = title.trim();

    await course.save();

    return section;
};
const deleteSectionService = async (
    currentUser,
    courseId,
    sectionId
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    const section = findSection(
        course,
        sectionId
    );

    section.deleteOne();

    // Reorder remaining sections
    course.sections.forEach(
        (section, index) => {
            section.order = index + 1;
        }
    );

    await course.save();
};
const createLessonService = async (
    currentUser,
    courseId,
    sectionId,
    title,
    videoUrl,
    duration,
    preview = false,
) => {

    // ----------------------------------
    // Get Authorized Course
    // ----------------------------------

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    // ----------------------------------
    // Get Section
    // ----------------------------------

    const section = findSection(
        course,
        sectionId
    );

    // ----------------------------------
    // Duplicate Lesson Validation
    // ----------------------------------

    const normalizedTitle = title.trim().toLowerCase();

    const lessonAlreadyExists = section.lessons.some(
        (lesson) =>
            lesson.title.trim().toLowerCase() === normalizedTitle
    );

    if (lessonAlreadyExists) {
        throw new ApiError(
            409,
            "Lesson title already exists."
        );
    }

    // ----------------------------------
    // Generate Lesson Order
    // ----------------------------------

    const maxOrder = section.lessons.reduce(
        (max, lesson) => Math.max(max, lesson.order),
        0
    );

    const order = maxOrder + 1;

    // ----------------------------------
    // Create Lesson
    // ----------------------------------

    section.lessons.push({
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        duration: Number(duration),
        preview,
        order,
    });

    // ----------------------------------
    // Save Course
    // ----------------------------------

    await course.save();

    // ----------------------------------
    // Return Newly Created Lesson
    // ----------------------------------

    return section.lessons.at(-1);
};

const getLessonService = async (
    currentUser,
    courseId,
    sectionId,
    lessonId
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    const section = findSection(
        course,
        sectionId
    );

    const lesson = section.lessons.id(
        lessonId
    );

    if (!lesson) {
        throw new ApiError(
            404,
            "Lesson not found."
        );
    }

    return lesson;
};

const updateLessonService = async (
    currentUser,
    courseId,
    sectionId,
    lessonId,
    lessonData
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    const section = findSection(
        course,
        sectionId
    );

    const lesson = section.lessons.id(
        lessonId
    );

    if (!lesson) {
        throw new ApiError(
            404,
            "Lesson not found."
        );
    }

    let isUpdated = false;

    if (
        lessonData.title !== undefined &&
        lessonData.title.trim() !== lesson.title
    ) {
        lesson.title = lessonData.title.trim();
        isUpdated = true;
    }

    if (
        lessonData.videoUrl !== undefined &&
        lessonData.videoUrl.trim() !== lesson.videoUrl
    ) {
        lesson.videoUrl =
            lessonData.videoUrl.trim();

        isUpdated = true;
    }

    if (
        lessonData.duration !== undefined &&
        Number(lessonData.duration) !== lesson.duration
    ) {
        lesson.duration =
            Number(lessonData.duration);

        isUpdated = true;
    }

    if (
        lessonData.preview !== undefined &&
        lessonData.preview !== lesson.preview
    ) {
        lesson.preview =
            lessonData.preview;

        isUpdated = true;
    }

    if (!isUpdated) {
        throw new ApiError(
            400,
            "No changes detected."
        );
    }

    await course.save();

    return lesson;
};

const deleteLessonService = async (
    currentUser,
    courseId,
    sectionId,
    lessonId
) => {

    const course = await findOwnedCourse(
        courseId,
        currentUser
    );

    const section = findSection(
        course,
        sectionId
    );

    const lesson = section.lessons.id(
        lessonId
    );

    if (!lesson) {
        throw new ApiError(
            404,
            "Lesson not found."
        );
    }

    lesson.deleteOne();

    // Reorder lessons
    section.lessons.forEach(
        (lesson, index) => {
            lesson.order = index + 1;
        }
    );

    await course.save();
};
export {
    getCourseService,
    getPublishedCourseService,
    getCourseByIdService,
    getPublishedCourseByIdService,
    getCoursesByTeacherService,
    createCourseService,
    updateCourseService,
    deleteCourseService,
    changeCourseStatusService,

    createSectionService,
    updateSectionService,
    deleteSectionService,
    
    getLessonService,
    createLessonService,
    updateLessonService,
    deleteLessonService
}