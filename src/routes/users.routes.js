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
} from "../controllers/user.controllercopy.js";


const router = Router();

// ---------- Public Routes ----------

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);


// ---------- Protected Routes ----------

router.use(verifyJWT);

router.post("/logout", logoutUser);

router.get("/profile", getCurrentUser);

router.patch("/update-profile", updateProfile);

router.patch("/change-password", changeCurrentPassword);

export default router;