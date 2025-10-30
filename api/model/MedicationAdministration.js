const mongoose = require("mongoose");

const medicationAdministrationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  caregiverName: { type: String, required: true },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medication",
    required: true,
  },
  time: { type: String, required: true },
  given: { type: Boolean, default: false },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
});

module.exports = mongoose.model("MedicationAdministration", medicationAdministrationSchema);
