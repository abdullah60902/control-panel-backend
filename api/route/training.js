const express = require("express");
const router = express.Router();
const Training = require("../model/Training");
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const upload = multer({ storage });
/**
 * ===================================================
 *  📦 CREATE Training Record (with File Upload)
 * ===================================================
 */
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const now = new Date();
      const expiry = new Date(req.body.expiryDate);
      let status = "Valid";
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) status = "Expired";
      else if (diffDays <= 30) status = "Expiring Soon";

      const training = new Training({
        ...req.body,
        attachments: req.files?.map((f) => f.path),
        status,
      });

      await training.save();
      res.status(201).json({ message: "Training record added", data: training });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
/**
 * ===================================================
 *  📋 GET All Trainings (Admin = all, Staff = own)
 * ===================================================
 *//**
 * ===================================================
 *  📋 GET All Trainings (Admin = all, Staff = own)
 * ===================================================
 */
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      let query = {};

      // ⭐ Staff → Only their own training records
      if (req.user.role === "Staff") {
        const hrId = req.user.hr?._id || req.user.hr || req.user._id;
        if (!hrId) return res.status(400).json({ message: "HR ID missing in token" });

        query.staffMember = hrId;
      }

      // ⭐ External → Same logic as StaffDocument (only their own)
      if (req.user.role === "External") {
        const hrId = req.user.hr?._id || req.user.hr || req.user._id;
        if (!hrId) return res.status(400).json({ message: "HR ID missing in token" });

        query.staffMember = hrId;
      }

      const trainings = await Training.find(query)
        .populate("staffMember", "fullName email position")
        .sort({ createdAt: -1 });

      if (!trainings.length)
        return res.status(404).json({ message: "No training records found" });

      res.status(200).json(trainings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


/**
 * ===================================================
 *  📊 TRAINING ANALYTICS (Expiry-based for Dashboard)
 * ===================================================
 */
router.get(
  "/analytics",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const trainings = await Training.find();
      const now = new Date();
      const soon = new Date();
      soon.setDate(now.getDate() + 30);

      let upToDate = 0;
      let expiringSoon = 0;
      let expired = 0;

      trainings.forEach((t) => {
        const expiry = new Date(t.expiryDate);
        if (expiry < now) expired++;
        else if (expiry <= soon) expiringSoon++;
        else upToDate++;
      });

      res.status(200).json({
        total: trainings.length,
        upToDate,
        expiringSoon,
        expired,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ===================================================
 *  ♻️ AUTO REFRESH TRAINING STATUS (used by frontend)
 * ===================================================
 */
router.put(
  "/refresh-status",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const trainings = await Training.find();
      const now = new Date();
      const soon = new Date();
      soon.setDate(now.getDate() + 30);

      for (const t of trainings) {
        let newStatus = "Valid";
        if (t.expiryDate < now) newStatus = "Expired";
        else if (t.expiryDate <= soon) newStatus = "Expiring Soon";

        if (t.status !== newStatus) {
          t.status = newStatus;
          await t.save();
        }
      }

      res.status(200).json({ message: "Training statuses updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


/**
 * ===================================================
 *  🔍 GET Single Training
 * ===================================================
 */
router.get(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const training = await Training.findById(req.params.id).populate(
        "staffMember",
        "fullName"
      );
      if (!training) return res.status(404).json({ message: "Not found" });
      res.status(200).json(training);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ===================================================
 *  ✏️ UPDATE Training (with optional new attachments)
 * ===================================================
 */
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existing = await Training.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });

      // 🧹 Delete old attachments if new ones are uploaded
      if (req.files && req.files.length > 0 && existing.attachments?.length > 0) {
        for (const url of existing.attachments) {
          const publicId = url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`careplans/${publicId}`);
        }
      }

      // 🧮 Recalculate status
      const now = new Date();
      const expiry = new Date(req.body.expiryDate);
      let status = "Valid";
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) status = "Expired";
      else if (diffDays <= 30) status = "Expiring Soon";

      const updatedData = {
        ...req.body,
        status,
        ...(req.files.length > 0 && { attachments: req.files.map((f) => f.path) }),
      };

      const updated = await Training.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
      });
      res.status(200).json({ message: "Training updated", data: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/**
 * ===================================================
 *  ❌ DELETE Training (and Cloudinary files)
 * ===================================================
 */
// GET all trainings of a staff member
router.get("/staff/:id", async (req, res) => {
  try {
    const data = await Training.find({ staffMember: req.params.id })
      .populate("staffMember")
      .sort({ createdAt: -1 });

    if (data.length === 0) {
      return res.status(404).json([]);
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deleted = await Training.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Not found" });

      if (deleted.attachments && deleted.attachments.length > 0) {
        for (const url of deleted.attachments) {
          const publicId = url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`careplans/${publicId}`);
        }
      }

      res.status(200).json({ message: "Training deleted", data: deleted });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


 

module.exports = router;
