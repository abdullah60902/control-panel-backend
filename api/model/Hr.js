const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema({
  // 🔹 Primary Identity
  fullName: { type: String, required: true },
  firstName:{ type: String },
  surname: { type: String },
  dob: { type: Date }, 
  niNumber: { type: String },

  // 🔹 Contact & Address
  contactNumber: { type: String },
  email: { type: String, required: true, unique: true },
  address: { type: String },

  // 🔹 Next of Kin
  nextOfKinName: { type: String },
  nextOfKinRelationship: { type: String },
  nextOfKinPhone: { type: String },
  nextOfKinEmail: { type: String },
  nextOfKinAddress: { type: String },

  // 🔹 Employment Details
  position: { type: String, required: true },
  primaryServiceType: { type: String },
  employmentType: { type: String },
  startDate: { type: Date, required: true },
  terminationStatus: { type: String },
  contractDetails: { type: String },

  // 🔹 Department & Care Setting
  department: {
    type: String,
    enum: ["Administration", "Nursing", "Management", "Care", "Support"],
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
  },

  // 🔹 Compliance
  dbsStatus: { type: String },
  professionalRegistration: { type: String },
  rightToWorkStatus: { type: String },

  // 🔹 Passport & Visa
  passportNumber: { type: String },
  passportCountry: { type: String },
  passportExpiry: { type: String },
  visaRequired: { type: String },
  visaNumber: { type: String },
  visaExpiry: { type: String },
profileImage: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("Hr", hrSchema);
