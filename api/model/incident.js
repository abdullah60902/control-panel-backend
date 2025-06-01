const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  incidentDate: {
    type: Date,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Reference to Client model
    required: true
  },
  incidentType: {
    type: String,
    enum: ['Fall', 'Medication Error', 'Behavioral', 'Property Damage', 'Injury' ,'Other'], // example options
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'], // example options
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
    status: {
    type: String,
    enum: ['Open', 'Under Investigation', 'Resolved'],
    default: 'Open' // default value, so no need to send it while creating
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
