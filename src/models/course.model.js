import mongoose, { Schema } from "mongoose";


const resourceSchema = new Schema(
  {
      title: {
          type: String,
          required: true,
          trim: true,
      },

      fileUrl: {
          type: String,
          required: true,
          trim: true,
      },
  },
  {
      _id: true,
  }
);

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
      trim: true,
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

    resources: [resourceSchema]
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
      trim: true,
    },

    thumbnail: {
      type: String,
      required: true,
      trim: true,
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

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator(value) {
          return value <= this.price;
        },
        message: "Discount price cannot exceed original price."
      }
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

courseSchema.index({
  status: 1,
  category: 1,
});

export const Course = mongoose.model("Course", courseSchema);