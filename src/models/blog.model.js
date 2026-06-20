import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    excerpt: {
      type: String,
      default: "",
      maxlength: 300,
    },

    content: {
        type: String,
        required: true,
      },

    thumbnail: {
      type: String,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
        default: [],
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    likes: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
        type: Date,
      }
  },
  {
    timestamps: true,
  }
);

export const Blog = mongoose.model("Blog", blogSchema);