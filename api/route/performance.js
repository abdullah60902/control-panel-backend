const express = require("express");
const router = express.Router();
const Performance = require("../model/Performance");
const { verifyToken, allowRoles } = require("../middleware/auth");

// 🔹 Create new performance record
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const newPerformance = new Performance({
      ...req.body,
      holidayAllowance: req.body.holidayAllowance,
      daysRemaining: req.body.daysRemaining,
      nextAppraisalDue: req.body.nextAppraisalDue,
      probationEndDate: req.body.probationEndDate
    });

    await newPerformance.save();

    res.status(201).json({
      message: "Performance record created",
      data: newPerformance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
                                                                  
// 🔹 Get all performance records
// 🔹 Get all performance records
// 🔹 Get all performance records
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      let query = {};

      // ⭐ Staff → Only their own performance records
      if (req.user.role === "Staff") {
        const hrId = req.user.hr?._id || req.user.hr || req.user._id;
        if (!hrId) return res.status(400).json({ msg: "HR ID missing in token" });

        query.staff = hrId;
      }

      // ⭐ Admin → see all records
      // ⭐ External → see all records (same as StaffDocument logic)

      const performances = await Performance.find(query)
        .populate("staff", "fullName email")
        .sort({ createdAt: -1 });

      if (!performances.length)
        return res.status(404).json({ message: "No performance records found" });

      res.status(200).json({ data: performances });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 🔹 Get performance records for a specific staff
router.get(
  "/staff/:id",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      const staffId = req.params.id;

      const records = await Performance.find({ staff: staffId })
        .populate("staff", "fullName email")
        .sort({ createdAt: -1 });

      if (records.length === 0) {
        return res.status(404).json([]);
      }

      res.json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🔹 Update a performance record
router.put("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const updated = await Performance.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        holidayAllowance: req.body.holidayAllowance,
        daysRemaining: req.body.daysRemaining,
        nextAppraisalDue: req.body.nextAppraisalDue,
        probationEndDate: req.body.probationEndDate
      },
      { new: true }
    );

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
