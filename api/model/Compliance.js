const mongoose = require("mongoose");

const complianceSchema = new mongoose.Schema(
  {
    requirement: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Health & Safety",
        "Clinical",
        "HR",
        "Documentation",
        "Environment",
        "Quality",
        "Audit"
      ],
      required: true,
    },
    lastReviewDate: {
      type: Date,
      required: true,
    },
    nextReviewDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Compliant", "Action Required", "Non-Compliant", "Upcoming","Other"],
      required: true,
    },
    notes: {
      type: String,
    },
    attachments: [{ type: String }], // File URLs or paths

    // 🆕 Visibility (controls who can view)
    visibility: {
      type: String,
      enum: ["Admin", "Staff", "External", "Everyone"],
      required: true,
      default: "Everyone",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Compliance", complianceSchema);
