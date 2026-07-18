import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createEnrollment,
  deleteEnrollment,
  getAllEnrollments,
  updateEnrollment,
} from "../controllers/enrollment.controller.js";

const router = Router();

// Get all enrollments
router.get("/", verifyJWT, getAllEnrollments);

// Create enrollment
router.post("/", verifyJWT, createEnrollment);

// Update enrollment
router.patch("/:enrollmentId", verifyJWT, updateEnrollment);

// Delete enrollment
router.delete("/:enrollmentId", verifyJWT, deleteEnrollment);

export default router;
