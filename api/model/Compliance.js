const mongoose = require("mongoose");

const complianceSchema = new mongoose.Schema({
  requirement: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Health & Safety", "Clinical", "HR", "Dcoumentation", "Environment" ,"Quality"], // You can customize these
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
  enum: ["Compliant", "Action Required", "Non-Compliant", "Upcoming"], // ✅ corrected spelling
    required: true,
  },
  notes: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model("Compliance", complianceSchema);
