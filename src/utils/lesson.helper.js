import { ApiError } from "./ApiError";

const findLesson = (section, lessonId) => {

    const lesson = section.lessons.id(lessonId);

    if (!lesson) {
        throw new ApiError(
            404,
            "Lesson not found"
        );
    }

    return lesson;
};

export { findLesson };