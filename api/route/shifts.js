const express = require("express");
const Shift = require("../model/Shift");
const router = express.Router();

// GET all shifts
router.get("/", async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ date: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET shifts for a specific staff
router.get("/staff/:staffId", async (req, res) => {
  try {
    const shifts = await Shift.find({ staff: req.params.staffId }).sort({ date: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new shift
router.post("/", async (req, res) => {
  if (!req.body.staff) return res.status(400).json({ message: "Staff ID is required" });
  const newShift = new Shift(req.body);
  try {
    const savedShift = await newShift.save();
    res.status(201).json(savedShift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update shift
router.put("/:id", async (req, res) => {
  try {
    const updatedShift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedShift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE shift
router.delete("/:id", async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: "Shift deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
