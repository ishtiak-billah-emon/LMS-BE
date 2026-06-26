import { Router } from "express";
import { registerUser } from "../controllers/user.controllercopy.js";
import { loginUser } from "../controllers/user.controllercopy.js";

const router = Router();
router.post("/register", registerUser);
router.post("/login", loginUser);


// secured route 
router.post("/logout", verifyJWT, logoutUser)



export default router;