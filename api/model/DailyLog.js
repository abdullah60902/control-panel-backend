const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    dateTime: { type: Date, required: true },
    staffName: { type: String, required: true },
    notes: { type: String },
    
    // Health & Wellbeing
    moodEmoji: { type: String }, // e.g., 'happy', 'neutral', etc.
    bristolScore: { type: Number },
    heartRate: { type: Number }, // BPM
    
    // Optional additional field found in frontend
    healthQuick: { type: String },

    status: { type: String, default: 'Active', enum: ['Active', 'Archived'] },
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
