const mongoose = require('mongoose');

const medicationAdministrationSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    medication: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicationRecord', required: true },
    caregiverName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    time: { type: String, required: true }, 
    given: { type: Boolean, default: true },
    notes: { type: String },
    
    status: { type: String, default: 'Recorded' },
}, { timestamps: true });

module.exports = mongoose.model('MedicationAdministration', medicationAdministrationSchema);
