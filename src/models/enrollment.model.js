import mongoose, { Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedLessons: [
      {
        type: Schema.Types.ObjectId,
      },
    ],

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
  }
);

export const Enrollment = mongoose.model(
  "Enrollment",
  enrollmentSchema
);