import { AsyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const optionalVerifyJWT = AsyncHandler(async (req, res, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
  
      if (!token) {
        return next();
      }
  
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
      req.user = await User.findById(decoded._id).select(
        "-password -refreshToken"
      );
  
      next();
    } catch {
      next();
    }
  });