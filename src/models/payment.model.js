import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
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

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "sslcommerz",
        "bkash_sendmoney",
        "nagad_sendmoney",
      ],
      required: true,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "completed",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    paidAt: Date,

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model(
  "Payment",
  paymentSchema
);