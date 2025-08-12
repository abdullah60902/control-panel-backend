const mongoose = require("mongoose");

const SocialActivitySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hr",
      required: true,
    },
    activityType: {
      type: String,
      enum: ["Family Visit", "Game", "Hobby", "Social Engagement", "Other"],
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    attachments: [String], // Media URLs (e.g. Cloudinary)
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialActivity", SocialActivitySchema);
