const mongoose = require("mongoose");

const staffDocumentSchema = new mongoose.Schema(
  {
    staffName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hr", // reference HR/Staff collection
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    // multiple file categories (arrays of file URLs)
    employmentContracts: [String],
    dbsCertificates: [String],
    idDocuments: [String],
    trainingCertificates: [String],
    appraisalsReviews: [String],
    disciplinaryRecords: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaffDocument", staffDocumentSchema);
