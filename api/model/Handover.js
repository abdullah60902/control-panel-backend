const mongoose = require('mongoose');

const handoverSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, required: true }, // Storing date part
    time: { type: String, required: true }, // Storing time string
    handingOver: { type: String },
    takingOver: { type: String },
    summaryNotes: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Archived'] },
}, { timestamps: true });

module.exports = mongoose.model('Handover', handoverSchema);
