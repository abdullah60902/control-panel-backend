const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr", // Make sure this is the correct model name
    required: true
  },
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
  }
}, { timestamps: true });

module.exports = mongoose.model("Performance", performanceSchema);
