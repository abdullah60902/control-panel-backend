const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  position: { type: String, required: true },
  department: {
    type: String,
    enum: ["Administration", "Nursing", "Management", "Care", "Support"], // Add more if needed
    required: true
  },
  careSetting: {
  type: String,
  enum: [
    'Residential Care',
    'Nursing Homes',
    'Learning Disabilities',
    'Supported Living',
    'Mental Health Support',
    'Domiciliary Care',
    'Other Services'
  ]
}
,
  startDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Hr", hrSchema);
