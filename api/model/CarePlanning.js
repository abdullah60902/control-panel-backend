const mongoose = require("mongoose");

const carePlanningSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  planType: { type: String, required: true },
  creationDate: { type: Date, required: true },
  reviewDate: { type: Date, required: true },
  carePlanDetails: { type: String, required: true },
  careSetting: { type: String },

  // Care Plan Status
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Declined"],
    default: "Pending",
  },
  signature: { type: String },
  declineReason: { type: String },

  // Review Status (NEW)
  reviewStatus: {
    type: String,
    enum: ["Pending Review", "Reviewed"],
    default: "Pending Review",
  },
  reviewedOn: { type: Date },

  // Health & Wellbeing Recordings
  bristolStoolChart: { type: String },
  mustScore: { type: String },
  heartRate: { type: Number },
  mood: { type: String },
  dailyLog: { type: String },
  attachments: [{ type: String }],
});

module.exports = mongoose.model("CarePlanning", carePlanningSchema);
