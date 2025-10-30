const express = require("express");
const router = express.Router();
const SocialActivity = require("../model/SocialActivity");
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { storage,cloudinary  } = require("../utils/cloudinary");
const upload = multer({ storage });
const User = require('../model/usermodel');
// ✅ CREATE new activity
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const activity = new SocialActivity({
        ...req.body,
        attachments: req.files?.map((f) => f.path),
      });

      const saved = await activity.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error("❌ CREATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ GET all activities for one client
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      let activities;

      // --- Admin, Staff, External: get all
      if (["Admin", "Staff", "External"].includes(req.user.role)) {
        activities = await SocialActivity.find()
          .populate("client", "fullName")
          .populate("caregiver", "fullName")
          .sort({ createdAt: -1 });
      }

      // --- Client or Family: only their attached clients
      else if (["Client", "Family"].includes(req.user.role)) {
        const user = await User.findById(req.user._id).populate("clients");

        if (!user || !user.clients || user.clients.length === 0) {
          return res.status(200).json([]); // no attached clients
        }

        const allowedClientIds = user.clients.map((c) => c._id);

        activities = await SocialActivity.find({
          client: { $in: allowedClientIds },
        })
          .populate("client", "fullName")
          .populate("caregiver", "fullName")
          .sort({ createdAt: -1 });
      }

      // --- Unauthorized
      else {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      res.json(activities);
    } catch (error) {
      console.error("🔥 SocialActivity Fetch Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// UPDATE Social Activity
// UPDATE Social Activity (replace Cloudinary files)
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existing = await SocialActivity.findById(req.params.id);

      if (!existing) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // ✅ Delete old files from Cloudinary if new ones are uploaded
      if (req.files && req.files.length > 0 && existing.attachments?.length > 0) {
        for (const url of existing.attachments) {
          const publicId = url.split("/").pop().split(".")[0]; // Extract publicId
          await cloudinary.uploader.destroy(`careplans/${publicId}`);
        }
      }

      const updates = {
        ...req.body,
      };

      if (req.files && req.files.length > 0) {
        updates.attachments = req.files.map((file) => file.path); // New Cloudinary URLs
      }

      const updated = await SocialActivity.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      });

      res.json(updated);
    } catch (err) {
      console.error("❌ UPDATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);


// DELETE Social Activity
// DELETE Social Activity
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const deleted = await SocialActivity.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // ✅ Delete files from Cloudinary
      if (deleted.attachments && deleted.attachments.length > 0) {
        for (const url of deleted.attachments) {
          const publicId = url.split("/").pop().split(".")[0]; // Extract publicId
          await cloudinary.uploader.destroy(`careplans/${publicId}`);
        }
      }

      res.json({ message: "Activity and attachments deleted successfully" });
    } catch (err) {
      console.error("❌ DELETE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);








module.exports = router;
