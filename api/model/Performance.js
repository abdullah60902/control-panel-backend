const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr",
    required: true
  },

  // OLD FIELDS
  supervisions: {
    type: String,
    required: true
  },
  appraisals: {
    type: String,
    required: true
  },
  objectivesKpi: {
    type: String,
    required: true
  },
  feedbackNotes: {
    type: String
  },
  appraisalReminderDate: {
    type: Date,
    required: true
  },

  // ⭐ NEW FIELDS (from your UI)
  holidayAllowance: {
    type: String,
  },
  daysRemaining: {
    type: String,
  },
  nextAppraisalDue: {
    type: String, // or Date if you want
  },
  probationEndDate: {
    type: String,
  }

}, { timestamps: true });

module.exports = mongoose.model("Performance", performanceSchema);
