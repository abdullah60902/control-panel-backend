const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    // Assuming staff are stored in Hr model
    ref: "Hr",
    required: true
    },
    trainingType: {
      type: String,
      enum: [
        "First Aid",
        "Fire Safety",
        "Moving & Handling",
        "Safeguarding",
        "GDPR",
        "Infection Control",
        "Medication Administration",
        "Dementia Care",
        "Autism & Learning Disabilities",
        "Epilepsy",
        "Mental Health",
        "Diabetes"
      ] ,
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
  ,
      attachments: [String], // Media URLs (e.g. Cloudinary)

}, { timestamps: true });
  
module.exports = mongoose.model("Training", trainingSchema);
