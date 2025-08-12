const { default: mongoose } = require("mongoose");

const incidentSchema = new mongoose.Schema({
  incidentDate: {
    type: Date,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  incidentType: {
    type: String,
    enum: ['Fall', 'Medication Error', 'Behavioral', 'Property Damage', 'Injury', 'Other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  reportedBy: {
    type: String,
    required: true
  },
  incidentDetails: {
    type: String,
    required: true
  },
  immediateActions: {
    type: String
  },
  staffInvolved: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hr'

  },
  peopleNotified: [String],
  outcomeStatus: {
    type: String
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['Open', 'Under Investigation', 'Resolved'],
    default: 'Open'
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Incident', incidentSchema);
  