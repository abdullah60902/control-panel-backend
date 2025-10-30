const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    attachments: [
      {
        type: String, // Cloudinary URLs
        required: true,
      },
    ],
    visibility: {
      type: String,
      enum: ["Admin Only", "Staff and Admin", "Everyone", "External"],
      default: "Admin Only",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "uploadedBy is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);
