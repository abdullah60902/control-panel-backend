const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr", // Assuming staff are stored in Hr model
    required: true
  },
  trainingType: {
    type: String,
    enum: ["First Aid", "Fire Safety", "Moving & Handling", "Safeguarding", "GDRR","Infection Control", "Medication Administration" ,"Dementia Care"], // Add your types
    required: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Training", trainingSchema);
