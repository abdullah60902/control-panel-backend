const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    planTitle: { type: String, required: true },
    dateOfAssessment: { type: Date, required: true },
    assessedBy: { type: String },
    overallRiskLevel: { type: String, enum: ['Low', 'Medium', 'High', ''] },
    status: { type: String, default: 'Active' },

    // Categories (Stored as a nested object)
    categories: {
        falls: {
            checked: Boolean,
            recency: String,
            frequency: String,
            severity: String,
            comments: String,
            mitigations: String
        },
        selfNeglect: {
            checked: Boolean,
            recency: String,
            frequency: String,
            severity: String,
            comments: String,
            mitigations: String
        },
        suicide: {
            checked: Boolean,
            recency: String,
            frequency: String,
            severity: String,
            comments: String,
            mitigations: String
        },
        aggression: {
            checked: Boolean,
            recency: String,
            frequency: String,
            severity: String,
            comments: String,
            mitigations: String
        },
        other: {
            checked: Boolean,
            recency: String,
            frequency: String,
            severity: String,
            comments: String,
            mitigations: String
        }
    },

    clinicalSummary: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
