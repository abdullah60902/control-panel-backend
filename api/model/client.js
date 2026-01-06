const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,

    // Basic Profile
    fullName: { type: String, required: true },
    surname: { type: String },
    dob: { type: Date },
    nhsNo: { type: String },
    niNo: { type: String },
    gender: { type: String },
    ethnicity: { type: String },
    religion: { type: String },
    mentalHealthStatus: { type: String },

    // Medical
    allergies: { type: String },
    primaryDiagnosis: { type: String },
    diagnosisDate: { type: Date },
    dailyLifeImpact: { type: String },

    // Next of Kin
    nokName: { type: String },
    nokPhone: { type: String },
    nokEmail: { type: String },
    nokAddress: { type: String },

    // GP Info
    gpSurgery: { type: String },
    gpDoctor: { type: String },
    gpPhone: { type: String },
    gpEmail: { type: String },
    gpAddress: { type: String },

    // Specialist / Hospital
    hospitalName: { type: String },
    consultantName: { type: String },
    specialistPhone: { type: String },
    specialistEmail: { type: String },
    hospitalAddress: { type: String },

    // Preferences
    importantToMe: { type: String },
    pleaseDo: { type: String },
    pleaseDont: { type: String },

    // Old fields
    age: { type: Number, required: true },
    roomNumber: { type: String, required: true },
    careType: { type: String, required: true },
    admissionDate: { type: Date, required: true },
        profileImage: { type: String }, // ✅ New field for client photo

  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
