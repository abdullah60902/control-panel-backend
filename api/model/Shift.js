const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr",
    required: true
  },
  date: { type: Date, required: true },
  type: { type: String, enum: ["shift", "dayoff"], default: "shift" },
  start: { type: String },
  end: { type: String },
  location: { type: String },
  resident: { type: String },
  rate: { type: String },
  hours: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Shift", ShiftSchema);
