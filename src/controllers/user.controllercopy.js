import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

import { loginUserService, registerUserService } from "../services/user.service.js";

const registerUser = AsyncHandler(async (req, res) => {

    const { fullName, userName, email, password, phone } = req.body;

    // Validation

    if (!fullName?.trim())
        throw new ApiError(400, "Full name is required");

    if (!userName?.trim())
        throw new ApiError(400, "Username is required");

    if (!email?.trim())
        throw new ApiError(400, "Email is required");

    if (!password?.trim())
        throw new ApiError(400, "Password is required");

    if (!phone?.trim())
        throw new ApiError(400, "Phone number is required");

    // Call service

    const createdUser = await registerUserService(req.body)


    // Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
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
        secure: true,
    }; */

    const {accessToken,refreshToken, loggedInUser} = await loginUserService(req.body)
    
    const options = {
        httpOnly: true,
        // secure:
        //     process.env.NODE_ENV === "production",
        secure: true,
    };

    return res
        .status(200)
        .cookie(
            "accessToken",
            accessToken,
            options
        )
        .cookie(
            "refreshToken",
            refreshToken,
            options
        )
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,accessToken, refreshToken
                },
                "User logged in successfully"
            )
        );
});


export { registerUser, loginUser };