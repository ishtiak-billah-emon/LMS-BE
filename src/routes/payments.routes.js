import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


// private routes

router.post(
    "/create",
    verifyJWT,
);

export default router;