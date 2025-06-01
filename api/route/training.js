const express = require("express");
const router = express.Router();
const Training = require("../model/Training");
const { verifyToken, allowRoles } = require("../middleware/auth"); // ✅ Import middleware

// ✅ Create training record — Admin & Staff
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const training = new Training(req.body);
    await training.save();
    res.status(201).json({ message: "Training record added", data: training });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all training records — Admin & Staff
router.get("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const trainings = await Training.find().populate("staffMember", "fullName email position");
    res.status(200).json(trainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get training by ID — Admin & Staff
router.get("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate("staffMember", "fullName");
    if (!training) return res.status(404).json({ message: "Not found" });
    res.status(200).json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update training record — Admin only
router.put("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const updated = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Training updated", data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete training record — Admin only
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const deleted = await Training.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Training deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
