const errorHandler = (err, req, res, next) => {

    if (err?.code === 11000) {
        const duplicateField = Object.keys(err.keyPattern || {})[0];
        const message = duplicateField === "phone"
            ? "This phone number is already registered. Please use a different number or log in."
            : "A user with these details already exists.";

        return res.status(409).json({
            success: false,
            message,
            errors: [],
        });
    }

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: err.success ?? false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack:
            process.env.NODE_ENV === "development"
                ? err.stack
                : undefined,
    });
};

export { errorHandler };
