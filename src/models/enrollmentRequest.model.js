import mongoose from "mongoose";

const enrollmentRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

paymentMethod: {
  type: String,
  enum: [
    "sslcommerz",
    "bkash_sendmoney",
    "nagad_sendmoney",
    "free",
  ],
  default: "bkash_sendmoney",
  required: true,
},

    transactionId: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("EnrollmentRequest", enrollmentRequestSchema);
