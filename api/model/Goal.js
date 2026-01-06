const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true },
    startDate: { type: Date },
    targetDate: { type: Date },
    metric: { type: String },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Complete'], default: 'Not Started' },
    statusHistory: [{
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String
    }] // Optional: track status changes over time
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
