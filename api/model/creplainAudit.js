const mongoose = require("mongoose");

const carePlanAuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: String, // The user who performed the action
      required: true,
    },
    action: {
      type: String, // e.g., "Created", "Updated", "Deleted"
      required: true,
    },
    module: {
      type: String,
      default: "Care Plan", // Module name
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client", // Reference to the related client
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CarePlanAuditLog", carePlanAuditLogSchema);
