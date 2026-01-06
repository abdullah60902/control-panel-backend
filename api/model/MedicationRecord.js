const mongoose = require('mongoose');

const medicationRecordSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    medicationName: { type: String, required: true },
    dosageRoute: { type: String },
    schedule: {
        frequency: String,
        times: [String]
    },
    lastGiven: { type: Date }, // Date & Time when it was last given
    
    // Unified structure to match frontend
    stock: {
        quantity: { type: Number, default: 0 },
        threshold: { type: Number, default: 5 }
    },
    // Keep flat fields for backward compatibility if needed, but try to rely on object above
    currentStock: { type: Number }, 
    stockUnit: { type: String },

    status: { type: String, default: 'Active', enum: ['Active', 'Archived'] },
}, { timestamps: true });

module.exports = mongoose.model('MedicationRecord', medicationRecordSchema);
