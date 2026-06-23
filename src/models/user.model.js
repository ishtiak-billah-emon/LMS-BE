import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DB_NAME } from "../constants.js";

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },


        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        class: {
            type: String,
            default: ""
        },
        institutionName : {
            type: String,
            default: ""
        },

        location : {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            default: "",
            maxlength: 500,
        },

        avatar: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "inactive", "suspended"],
            default: "active"
        },

        role: {
            type: String,
            enum: ["owner", "admin", "teacher", "student"],
            default: "student",
        },


        bookmarkedCourses: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course",
            },
        ],

        bookmarkedBlogs: [
            {
                type: Schema.Types.ObjectId,
                ref: "Blog",
            },
        ],

        cartCourses: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course",
            },
        ],

        isVerified: {
            type: Boolean,
            default: false
        },

        socialLinks: {
            facebook: {
                type: String,
                default: "",
            },

            twitter: {
                type: String,
                default: "",
            },

            linkedin: {
                type: String,
                default: "",
            },

            github: {
                type: String,
                default: "",
            },

            website: {
                type: String,
                default: "",
            },
        },

        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};



export const User = mongoose.model("User", userSchema);