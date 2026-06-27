import { ApiError } from "../utils/ApiError.js";

const findSection = (course, sectionId) => {

    const section = course.sections.id(sectionId);

    if (!section) {
        throw new ApiError(
            404,
            "Section not found"
        );
    }

    return section;
};

export { findSection };