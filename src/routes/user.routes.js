import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controllercopy.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/register", registerUser);
router.post("/login", loginUser);


// secured route 
router.post("/logout",verifyJWT, logoutUser)


// Token
router.post("/refresh-token",refreshAccessToken)


export default router;