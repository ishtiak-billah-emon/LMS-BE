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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedLessons: [
      {
        lesson: {
          type: Schema.Types.ObjectId,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
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
    totalAmount: {
      type: Number,
      default: 0,
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