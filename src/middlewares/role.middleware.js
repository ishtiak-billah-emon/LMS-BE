import { ApiError } from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            throw new ApiError(
                401,
                "Unauthorized request"
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action"
            );
        }

        next();
    };
};

export { authorizeRoles };