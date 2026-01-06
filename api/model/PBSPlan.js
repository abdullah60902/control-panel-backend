const mongoose = require('mongoose');

const pbsPlanSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    type: { type: String, required: true }, // e.g., "Core Behaviour Support Plan"
    planTitle: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Archived'] },
    nextReviewDate: { type: Date },

    // Common PBS Fields
    hypothesisedFunction: String,
    targetBehaviours: String,
    settingEvents: String,
    generalApproach: String,
    skillDevelopment: String,
    earlyWarningSigns: String,

    // Step Responses (naming varies in frontend forms, mapping all variants)
    step1Response: String, // Also "step1"
    step2Intervention: String, // Also "step2"
    step3HighRisk: String, // Also "step3"

    // Additional Fields (Generic Care Plan etc)
    notes: String,
    frequency: String,
    assistanceLevel: String,
    dietType: String,
    sleepRoutine: String,

    archived: { type: Boolean, default: false }, // Explicit archive flag if needed
    
}, { timestamps: true });

module.exports = mongoose.model('PBSPlan', pbsPlanSchema);
