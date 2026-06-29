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

const updateProfileService = async (currentUser, updateData) => {
    const {
        _id,
        email: currentEmail,
        phone: currentPhone,
        socialLinks: currentSocialLinks,
    } = currentUser;

    const {
        userName,
        fullName,
        email,
        phone,
        class: studentClass,
        institutionName,
        location,
        bio,
        socialLinks,
    } = updateData;

    // -------------------------------
    // Check uniqueness (only if changed)
    // -------------------------------

    const emailQuery =
        email && email.trim().toLowerCase() !== currentEmail
            ? User.findOne({
                  email: email.trim().toLowerCase(),
                  _id: { $ne: _id },
              })
            : Promise.resolve(null);

    const phoneQuery =
        phone && phone.trim() !== currentPhone
            ? User.findOne({
                  phone: phone.trim(),
                  _id: { $ne: _id },
              })
            : Promise.resolve(null);

    const [existingEmail, existingPhone] = await Promise.all([
        emailQuery,
        phoneQuery,
    ]);

    if (existingEmail) {
        throw new ApiError(409, "Email already exists");
    }

    if (existingPhone) {
        throw new ApiError(409, "Phone number already exists");
    }

    // -------------------------------
    // Build update object
    // -------------------------------

    const updateFields = {};

    const fields = {
        userName,
        fullName,
        email,
        phone,
        class: studentClass,
        institutionName,
        location,
        bio,
    };

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
            updateFields[key] =
                typeof value === "string"
                    ? key === "email"
                        ? value.trim().toLowerCase()
                        : value.trim()
                    : value;
        }
    });

    // -------------------------------
    // Merge Social Links
    // -------------------------------

    if (socialLinks && typeof socialLinks === "object") {
        const trimmedSocialLinks = {};

        Object.entries(socialLinks).forEach(([key, value]) => {
            trimmedSocialLinks[key] =
                typeof value === "string" ? value.trim() : value;
        });

        updateFields.socialLinks = {
            ...currentSocialLinks,
            ...trimmedSocialLinks,
        };
    }

    // -------------------------------
    // Nothing to update
    // -------------------------------

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No valid fields provided to update");
    }

    // -------------------------------
    // Update User
    // -------------------------------

    const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
            $set: updateFields,
        },
        {
            new: true,
            runValidators: true,
        }
    ).select("-password -refreshToken");

    return updatedUser;
};


export { registerUserService, loginUserService, updateProfileService };