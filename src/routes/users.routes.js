import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  forgotPassword,
  resetPassword,
  setDailyGoal,
  getTodayActivity,
  getLearningHistory,
  updateProfile,
  getMyCourses,
  getStudents,
  getStudentById,
} from "../controllers/user.controllercopy.js";

const router = Router();

// ---------- Public Routes ----------

router.post("/register", registerUser);
// Keep password guessing from making unlimited requests to the login handler.
router.route("/login").post(loginRateLimiter, loginUser);
router.post("/refresh-token", refreshAccessToken);

// Password reset (public, rate-limited)
router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  forgotPassword
);
router.post("/reset-password/:token", resetPassword);

// ---------- Protected Routes ----------

router.use(verifyJWT);

router.post("/logout", logoutUser);

router.get("/current-user", getCurrentUser);

router.patch(
  "/update-profile",
  upload.single("avatar"),
  updateProfile
);

router.patch("/change-password", changeCurrentPassword);

router.patch("/daily-goal", setDailyGoal);

router.get("/today-activity", getTodayActivity);

router.get("/learning-history", getLearningHistory);

router.get("/my-courses", getMyCourses);

router.get("/total-students", getStudents);

router.get("/:studentId", getStudentById);

export default router;
