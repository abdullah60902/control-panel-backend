const express = require("express");
const router = express.Router();
const Training = require("../model/Training");
const { verifyToken, allowRoles } = require("../middleware/auth");
const Hr = require("../model/Hr");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const upload = multer({ storage });

// ✅ CREATE training with file upload
router.post("/", verifyToken, allowRoles("Admin", "Staff"), upload.array("attachments"), async (req, res) => {
  try {
    const training = new Training({
      ...req.body,
      attachments: req.files?.map((f) => f.path), // Cloudinary URLs
    });

    await training.save();
    res.status(201).json({ message: "Training record added", data: training });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ GET all trainings
router.get("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const trainings = await Training.find().populate("staffMember", "fullName email position");
    res.status(200).json(trainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET: Training analytics by care setting
// ✅ TRAINING ANALYTICS


// ✅ GET single training
router.get("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate("staffMember", "fullName");
    if (!training) return res.status(404).json({ message: "Not found" });
    res.status(200).json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ UPDATE training with optional new attachments
router.put("/:id", verifyToken, allowRoles("Admin"), upload.array("attachments"), async (req, res) => {
  try {
    const existing = await Training.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    // ❌ Delete old attachments if new ones are uploaded
    if (req.files && req.files.length > 0 && existing.attachments?.length > 0) {
      for (const url of existing.attachments) {
        const publicId = url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`careplans/${publicId}`);
      }
    }

    const updatedData = {
      ...req.body,
      ...(req.files.length > 0 && { attachments: req.files.map(file => file.path) }),
    };

    const updated = await Training.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json({ message: "Training updated", data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE training and its Cloudinary attachments
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
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
});

module.exports = router;
