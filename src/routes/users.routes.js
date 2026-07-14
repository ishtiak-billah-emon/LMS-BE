import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateProfile,
  getMyCourses,
  getStudents,
  getStudentById,
} from "../controllers/user.controllercopy.js";

const router = Router();

// ---------- Public Routes ----------

router.post("/register", registerUser);
router.route("/login").post(loginUser);
router.post("/refresh-token", refreshAccessToken);

// ---------- Protected Routes ----------

router.use(verifyJWT);

router.post("/logout", logoutUser);

router.get("/current-user", getCurrentUser);

router.patch("/update-profile", updateProfile);

router.patch("/change-password", changeCurrentPassword);

router.get("/my-courses", getMyCourses);

router.get("/total-students", getStudents);

router.get("/:studentId", getStudentById);

export default router;
