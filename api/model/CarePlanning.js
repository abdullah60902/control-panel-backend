const mongoose = require("mongoose");

const carePlanningSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  planType: { type: String, required: true },
  creationDate: { type: Date, required: true },
  reviewDate: { type: Date, required: true },
  carePlanDetails: { type: String, required: true },

  // New Field: Care Setting / Service Type
  careSetting: { type: String }, // <-- Added this line

  // Status & Signature
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending'
  },
  signature: { type: String },
  declineReason: { type: String },

  // Health & Wellbeing Recordings
  bristolStoolChart: { type: String },
  mustScore: { type: String },
  heartRate: { type: Number },
  mood: { type: String },
  dailyLog: { type: String },
  attachments: [{ type: String }] // File URLs or paths
});

module.exports = mongoose.model("CarePlanning", carePlanningSchema);
