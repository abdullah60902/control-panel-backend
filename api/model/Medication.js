const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  caregiverName: { type: String, required: true },
  medicationName: { type: String, required: true },
   status: {
    type: String,
    enum: ['Pending', 'Completed', ],
    default: 'Pending'
  },
  schedule: {
    frequency: { type: String },
    times: [String], // ✅ Correct field name
  },
  stock: {
    quantity: { type: Number, default: 0 },
    threshold: { type: Number, default: 5 }, // alert if below
  },
  attachments: [{ type: String }], // File URLs or paths

  history: [
    {
      date: { type: String }, // '2024-07-01'
      time: { type: String },
      given: { type: Boolean },
      caregiver: { type: String },
    },
  ],
});

module.exports = mongoose.model("Medication", medicationSchema);
