import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { createCourseService, createLessonService, createSectionService, getCourseByIdService, getCourseService, updateCourseService } from "../services/course.service.js"

const createCourse = AsyncHandler(async (req, res) => {

    const {
        title,
        description,
        category,
        price,
        discountPrice,
    } = req.body;

    // Required field validation
    const requiredFields = [
        { value: title, name: "Title" },
        { value: description, name: "Description" },
        { value: category, name: "Category" },
        { value: price, name: "Price" },
    ];

    requiredFields.forEach((field) => {
        if (
            field.value === undefined ||
            field.value.toString().trim() === ""
        ) {
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
    return res.status(201).json(
        new ApiResponse(
            201,
            course,
            "Course created successfully"
        )
    );

})

const updateCourse = AsyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const thumbnailFile = req.files?.thumbnail?.[0];

    const updatedCourse = await updateCourseService(
        req.user,
        courseId,
        req.body,
        thumbnailFile?.path
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCourse,
            "Course updated successfully"
        )
    );
});

const getCourse = AsyncHandler(async(req, res)=> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const courses = await getCourseService(page, limit);
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            courses,
            "Get courses successfully"
        )
    );
    
})
const getCourseById = AsyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await getCourseByIdService(courseId);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                course,
                "Get course successfully By Id"
            )
        );
})

const createSection = AsyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const {
        title,
    } = req.body;
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Section title is required");
    }
    const updatedCourse = await createSectionService(
        req.user,
        courseId,
        title
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            updatedCourse,
            "Section created successfully"
        )
    );
})

const createLesson = AsyncHandler(async (req, res) => {
    const { courseId, sectionId } = req.params;
    const {
        title,
        videoUrl,
        duration,
        preview,
    } = req.body;

    const requiredFields = [
        { value: title, name: 'Title' },
        { value: videoUrl, name: 'Video URL' },
        { value: duration, name: 'Duration' },
        { value: preview, name: 'preview' },
    ]

    requiredFields.forEach((field) => {
        if (field.value === undefined || field.value.toString().trim() === "") {
            throw new ApiError(400, `${field.name} is required`);
        }
    })

    // Duration validation (seconds)
    if (!Number.isInteger(Number(duration)) || Number(duration) <= 0) {
        throw new ApiError(
            400,
            "Duration must be a positive integer in seconds."
        );
    }

    // Preview validation (optional)
    if (
        preview !== undefined &&
        typeof preview !== "boolean"
    ) {
        throw new ApiError(
            400,
            "Preview must be a boolean value."
        );
    }

    // service called 

    const updatedCourse = await createLessonService(
        req.user,
        courseId,
        sectionId,
        title,
        videoUrl,
        duration,
        preview,

    )

    return res.status(201).json(
        new ApiResponse(
            201,
            updatedCourse,
            "Lesson created successfully"
        )
    );
})

export {
    getCourse,
    getCourseById,
    createCourse,
    updateCourse,
    createSection,
    createLesson
}