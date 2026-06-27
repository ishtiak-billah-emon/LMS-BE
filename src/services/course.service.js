import slugify from "slugify";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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

const getCourseByIdService = async (courseId) => {

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

// const publishCourseService = 




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

export {
    getCourseService,
    getCourseByIdService,
    createCourseService,
    updateCourseService,
    createSectionService,
    createLessonService
}