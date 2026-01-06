const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    dolsInPlace: { type: String, enum: ['Yes', 'No'], required: true },
    authorizationEndDate: { type: Date },
    conditions: { type: String },
    
    // Additional fields if needed for future extensions (e.g. general stats)
    status: { type: String, default: 'Active', enum: ['Active', 'Archived'] },
}, { timestamps: true });

module.exports = mongoose.model('ConsentRecord', consentSchema);
