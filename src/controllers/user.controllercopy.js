import crypto from "crypto";
import fs from "fs";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { isValidEmail, isStrongPassword, PASSWORD_RULES } from "../utils/validators.js";
import { sendPasswordResetEmail } from "../services/email.service.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

import {
  loginUserService,
  registerUserService,
  updateProfileService,
  getMyCoursesService,
  getStudentService,
  getStudentByIdService,
  setDailyGoalService,
} from "../services/user.service.js";
import { getTodayActivityService, getLearningHistoryService } from "../services/enrollment.service.js";
import { User } from "../models/user.model.js";

const registerUser = AsyncHandler(async (req, res) => {
  const { fullName, userName, email, password, phone } = req.body;

  // Validation

  if (!fullName?.trim()) throw new ApiError(400, "Full name is required");

  if (!userName?.trim()) throw new ApiError(400, "Username is required");

  if (!email?.trim()) throw new ApiError(400, "Email is required");

  if (!password?.trim()) throw new ApiError(400, "Password is required");

  if (!phone?.trim()) throw new ApiError(400, "Phone number is required");

  // Call service

  const createdUser = await registerUserService(req.body);

  // Send response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  if (!password?.trim()) {
    throw new ApiError(400, "Password is required");
  }

  /* const user = await User.findOne({
        email: email.toLowerCase().trim(),
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid =
        await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Invalid user credentials"
        );
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(
            user._id
        );

    const loggedInUser = await User.findById(
        user._id
    ).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        // secure:
        //     process.env.NODE_ENV === "production",
        secure: false,
    }; */

  const { accessToken, refreshToken, loggedInUser } = await loginUserService(
    req.body
  );

  const options = {
    httpOnly: true,
    // secure:
    //     process.env.NODE_ENV === "production",
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = AsyncHandler(async (req, res) => {
  // take data middleware response

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {
          // no data
        },
        "User Logged Out Successfully"
      )
    );
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: false,
    };

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Accessed Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token ");
  }
});

const setDailyGoal = AsyncHandler(async (req, res) => {
  const { dailyLessonGoal } = req.body;

  const user = await setDailyGoalService(req.user, dailyLessonGoal);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Daily goal updated successfully"));
});

const getTodayActivity = AsyncHandler(async (req, res) => {
  const items = await getTodayActivityService(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, items, "Today's activity fetched successfully"));
});

const getLearningHistory = AsyncHandler(async (req, res) => {
  const history = await getLearningHistoryService(req.user);

  return res
    .status(200)
    .json(
      new ApiResponse(200, history, "Learning history fetched successfully")
    );
});

const changeCurrentPassword = AsyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old password and new password can not be same");
  }

  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, PASSWORD_RULES);
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Inavalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const forgotPassword = AsyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always respond with the same message whether or not the account exists.
  const genericMessage =
    "If an account with that email exists, we have sent a password reset link.";

  if (user) {
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({ email: user.email, resetURL });
    } catch (error) {
      // Roll back the token so a failed send doesn't leave a dangling reset.
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      throw error;
    }
  }

  return res.status(200).json(new ApiResponse(200, {}, genericMessage));
});

const resetPassword = AsyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "Password is required");
  }

  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, PASSWORD_RULES);
  }

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  // Hash the incoming token the same way it was stored, then look it up.
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  user.password = newPassword;
  user.clearPasswordResetToken();
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password has been reset successfully. You can now log in with your new password."
      )
    );
});

const getCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateProfile = AsyncHandler(async (req, res) => {
  const {
    userName,
    fullName,
    email,
    phone,
    class: studentClass,
    institutionName,
    location,
    bio,
    socialLinks: socialLinksRaw,
  } = req.body;

  // socialLinks may arrive as a JSON string when sent via multipart/form-data.
  let socialLinks = socialLinksRaw;
  if (typeof socialLinks === "string") {
    try {
      socialLinks = JSON.parse(socialLinks);
    } catch {
      socialLinks = undefined;
    }
  }

  const fieldsToValidate = [
    { value: userName, name: "Username" },
    { value: fullName, name: "Full name" },
    { value: email, name: "Email" },
    { value: phone, name: "Phone" },
    { value: studentClass, name: "Class" },
    { value: institutionName, name: "Institution name" },
    { value: location, name: "Location" },
  ];

  fieldsToValidate.forEach((field) => {
    if (field.value !== undefined && field.value.trim() === "") {
      throw new ApiError(400, `${field.name} cannot be empty`);
    }
  });

  if (bio !== undefined && bio.length > 500) {
    throw new ApiError(400, "Bio cannot exceed 500 characters");
  }

  const updateData = {
    userName,
    fullName,
    email,
    phone,
    class: studentClass,
    institutionName,
    location,
    bio,
    socialLinks,
  };

  // Handle avatar upload (profile picture) via Cloudinary.
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);

    if (!uploaded?.secure_url) {
      throw new ApiError(500, "Failed to upload profile picture");
    }

    updateData.avatar = uploaded.secure_url;

    // Remove the previously stored avatar to avoid orphans.
    if (req.user?.avatar) {
      await deleteFromCloudinary(req.user.avatar);
    }
  }

  const updatedUser = await updateProfileService(req.user, updateData);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile Details updated successfully")
    );
});

const getMyCourses = AsyncHandler(async (req, res) => {
  const courses = await getMyCoursesService(req.user);

  res
    .status(200)
    .json(new ApiResponse(200, courses, "Courses fetched successfully"));
});

const getStudents = AsyncHandler(async (req, res) => {
  const users = await getStudentService();

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const getStudentById = AsyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await getStudentByIdService(studentId);

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  forgotPassword,
  resetPassword,
  setDailyGoal,
  getTodayActivity,
  getLearningHistory,
  getCurrentUser,
  updateProfile,
  getMyCourses,
  getStudents,
  getStudentById,
};
