import mongoose, { Schema } from "mongoose";

const lessonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    duration: {
      type: Number, // seconds
      default: 0,
    },

    preview: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      required: true,
    },
  },
  {
    _id: true,
  }
);

const sectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
    },

    lessons: [lessonSchema],
  },
  {
    _id: true,
  }
);

const courseSchema = new Schema(
  {
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

    description: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    language: {
      type: String,
      default: "Bangla",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDuration: {
      type: Number,
      default: 0, // seconds
    },

    totalStudents: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sections: [sectionSchema],
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", courseSchema);