// model/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  requirement: { type: String }, // ← یہ ضروری ہے
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client',},

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
