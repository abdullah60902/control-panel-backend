const mongoose = require("mongoose");

const MauditlogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  requirement: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  medicationName: { type: String }, // ✅ Medication name
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Mauditlog", MauditlogSchema);
