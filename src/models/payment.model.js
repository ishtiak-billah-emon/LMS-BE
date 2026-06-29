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
    coursePrice: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: [
        "BDT",
        "USD",
        "EUR",
        "GBP",
      ],
      default: "BDT",
    },

    paymentMethod: {
      type: String,
      enum: [
        "sslcommerz",
        "bkash_sendmoney",
        "nagad_sendmoney",
        "free",
      ],
      required: true,
    },

    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: null,
    },
    // Store the complete response from SSLCommerz (optional but recommended)
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
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
      index: true,
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

paymentSchema.index({
  student: 1,
  status: 1,
});

paymentSchema.index({
  course: 1,
  status: 1,
});
export const Payment = mongoose.model(
  "Payment",
  paymentSchema
);