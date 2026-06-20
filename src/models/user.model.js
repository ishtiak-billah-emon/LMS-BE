import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
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

        bio: {
            type: String,
            default: "",
            maxlength: 500,
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


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

export const User = mongoose.model("User", userSchema);