const mongoose = require("mongoose");

const StaffPayInfoSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr",
    required: true,
    unique: true
  },

  payType: { type: String, default: "Hourly" },
  payGrade: { type: String, default: "" },
  hourlyRate: { type: String, default: "" },
  overtimeRate: { type: String, default: "" },
  taxInfo: { type: String, default: "" },

  bankAccountName: { type: String, default: "" },
  sortCode: { type: String, default: "" },
  accountNumber: { type: String, default: "" },
  bankName: { type: String, default: "" },

  payslips: [
    {
      period: String,
      fileDate: String,
      fileUrl: String,
    }
  ],

  timesheets: [
    {
      period: String,
      totalHours: String,
      status: String,
      fileUrl: String
    }
  ]
});

module.exports = mongoose.model("StaffPayInfo", StaffPayInfoSchema);
