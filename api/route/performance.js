const express = require("express");
const router = express.Router();
const Performance = require("../model/Performance");
const { verifyToken, allowRoles } = require("../middleware/auth");

// 🔹 Create new performance record
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const newPerformance = new Performance(req.body);
    await newPerformance.save();
    res.status(201).json({ message: "Performance record created", data: newPerformance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Get all performance records
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      console.log("🔍 Current user:", req.user); // 👈 Add this

      const performances = await Performance.find().populate("staff", "fullName");
      res.status(200).json({ data: performances });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🔹 Update a performance record
router.put("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const updated = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Performance record updated", data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Delete a performance record
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    await Performance.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Performance record deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔔 Get reminders due today or earlier
router.get("/reminders/due", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueReminders = await Performance.find({
      appraisalReminderDate: { $lte: today }
    }).populate("staff", "fullName");

    res.status(200).json({
      message: `Found ${dueReminders.length} due reminders`,
      data: dueReminders,
      toast: "Reminders fetched successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
