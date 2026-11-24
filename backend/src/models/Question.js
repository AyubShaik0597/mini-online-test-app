import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          Array.isArray(options) &&
          options.length === 4 &&
          options.every((option) => String(option).trim()),
        message: "Each question must have four non-empty options."
      }
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    subject: {
      type: String,
      default: "General Knowledge"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Question", questionSchema);