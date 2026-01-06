const mongoose = require("mongoose");

const carePlanningSchema = new mongoose.Schema({
  // 🔹 Existing (UNCHANGED)
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  planType: { type: String, required: true },
  creationDate: { type: Date, required: true },
  reviewDate: { type: Date, required: true },
  carePlanDetails: { type: String },
  careSetting: { type: String },

  status: {
    type: String,
    enum: ["Pending", "Accepted", "Declined"],
    default: "Pending",
  },
  signature: { type: String },
  declineReason: { type: String },

  reviewStatus: {
    type: String,
    enum: ["Pending Review", "Reviewed"],
    default: "Pending Review",
  },
  reviewedOn: { type: Date },

  bristolStoolChart: { type: String },
  mustScore: { type: String },
  heartRate: { type: Number },
  mood: { type: String },
  dailyLog: { type: String },

  attachments: [{ type: String }],

  // ==================================================
  // ✅ NEW (FORM DATA — NOTHING REMOVED)
  // ==================================================
 carePlanData: {
  // COMMON FIELDS
  preparedBy: String,
  currentAbility: String,
  careAims: String,

  dateCreated: Date,
  nextReviewDate: Date,

  // HEALTH / CONTINENCE / SLEEPING CARE PLAN
  supportSteps: String,       // Detailed Steps to Achieve Aims
  medicalDetails: String,     // Relevant Medical/Recording Details
  sleepRoutine: String,       // Specific to Sleeping Care Plan (optional)

  // NUTRITION & HYDRATION PLAN
  dietType: String,
  fluidRequirements: String,
  mealtimeSupport: String,
  weighingFrequency: String,
  preferredScale: String,

  // ORAL CARE PLAN
  dentalAids: String,
  dentalContact: String,
  oralHygieneSchedule: String,
  monitoringNotes: String,

  // FUTURE SAFE EXTENSIONS
  notes: String,
  frequency: String,
  assistanceLevel: String,
}

});

module.exports = mongoose.model("CarePlanning", carePlanningSchema);
