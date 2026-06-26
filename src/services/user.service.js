import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const generateAccessAndRefreshTokens = async (user) => {
    try {

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save refresh token to db
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken }

    } catch (error) {
        console.error("Error at tokens:  ",error)
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUserService = async ({
    fullName,
    userName,
    email,
    password,
    phone,
}) => {

    // Check if user already exists
    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // Create user
    const user = await User.create({
        fullName,
        userName,
        email,
        password,
        phone,
    });

    // Return created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return createdUser;
};


const loginUserService = async ({
    email, password
}) => {
 
    // Query 1
    const user = await User.findOne({
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
            user
        );

    // remove the token and password without query
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;


    return { accessToken, refreshToken, loggedInUser: userObject }

};
export { registerUserService, loginUserService };