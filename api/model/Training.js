const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    staffMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hr",
      required: true,
    },
    trainingType: {
      type: String,
      enum: [
        "First Aid",
        "Fire Safety",
        "Moving & Handling",
        "Safeguarding",
        "GDPR",
        "Infection Control",
        "Medication Administration",
        "Dementia Care",
        "Autism & Learning Disabilities",
        "Epilepsy",
        "Mental Health",
        "Diabetes",
      ],
      required: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    notes: String,
    other: String,
    attachments: [String], // Cloudinary URLs

    // ✅ Auto-status field
    status: {
      type: String,
      enum: ["Valid", "Expiring Soon", "Expired"],
      default: "Valid",
    },
  },
  { timestamps: true }
);

// 🧠 Auto-calculate status before save
trainingSchema.pre("save", function (next) {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 30);

  if (this.expiryDate < now) {
    this.status = "Expired";
  } else if (this.expiryDate <= soon) {
    this.status = "Expiring Soon";
  } else {
    this.status = "Valid";
  }
  next();
});

// 🧠 Auto-calculate status before update (PUT / PATCH)
trainingSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};

  // agar expiryDate nahi aaya, to existing doc se le aayenge
  if (!update.expiryDate) {
    this.model.findOne(this.getQuery()).then((doc) => {
      if (doc) {
        const now = new Date();
        const soon = new Date();
        soon.setDate(now.getDate() + 30);

        const expiry = new Date(doc.expiryDate);
        if (expiry < now) {
          update.status = "Expired";
        } else if (expiry <= soon) {
          update.status = "Expiring Soon";
        } else {
          update.status = "Valid";
        }
        this.setUpdate(update);
      }
      next();
    });
  } else {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);

    const expiry = new Date(update.expiryDate);
    if (expiry < now) {
      update.status = "Expired";
    } else if (expiry <= soon) {
      update.status = "Expiring Soon";
    } else {
      update.status = "Valid";
    }
    this.setUpdate(update);
    next();
  }
});

module.exports = mongoose.model("Training", trainingSchema);
