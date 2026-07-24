import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
app.use(
  cors({
    // ponytail: origin read lazily per-request because dotenv.config() in
    // index.js runs after this module's imports are evaluated (ESM hoisting),
    // so a static value here would always be undefined
    origin: (_origin, callback) => callback(null, process.env.CORS_ORIGIN),
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

import userRouter from "./routes/users.routes.js";
import courseRouter from "./routes/courses.routes.js";
import paymentRouter from "./routes/payments.routes.js";
import enrollmentRouter from "./routes/enrollments.route.js"
import reviewRouter from "./routes/reviews.routes.js"
import blogRouter from "./routes/blogs.routes.js"

// routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/enrollments", enrollmentRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/blogs", blogRouter);

// global error handling
app.use(errorHandler);
export { app };
