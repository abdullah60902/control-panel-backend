const express = require("express");
const router = express.Router();
const DailyLog = require("../model/DailyLog");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Daily Log ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        clientId,
        dateTime,
        staffName,
        notes,
        moodEmoji,
        bristolScore,
        heartRate,
        healthQuick,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const newLog = new DailyLog({
        client: clientId,
        dateTime,
        staffName,
        notes,
        moodEmoji,
        bristolScore,
        heartRate,
        healthQuick,
        status: "Active",
      });

      const savedLog = await newLog.save();
      res.status(201).json(savedLog);
    } catch (error) {
      console.error("Error creating Daily Log:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Daily Logs for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      const logs = await DailyLog.find({ client: req.params.clientId }).sort({
        dateTime: -1,
      });
      res.status(200).json(logs);
    } catch (error) {
      console.error("Error fetching Daily Logs:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET — Daily Logs older than 6 months ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      // Find logs where dateTime is before the cutoff
      const logs = await DailyLog.find({
        dateTime: { $lt: cutoff },
      })
        .populate("client", "fullName")
        .sort({ dateTime: -1 });

      res.status(200).json({
        count: logs.length,
        cutoff: cutoff.toISOString(),
        logs,
      });
    } catch (error) {
      console.error("Error fetching older Daily Logs:", error);
      res.status(500).json({ error: "Failed to fetch older daily logs" });
    }
  }
);

// === UPDATE Daily Log ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const updatedLog = await DailyLog.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedLog) {
        return res.status(404).json({ error: "Daily Log not found" });
      }

      res.status(200).json(updatedLog);
    } catch (error) {
      console.error("Error updating Daily Log:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Daily Log ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedLog = await DailyLog.findByIdAndDelete(req.params.id);
      if (!deletedLog) {
        return res.status(404).json({ error: "Daily Log not found" });
      }
      res.status(200).json({ message: "Daily Log deleted successfully" });
    } catch (error) {
      console.error("Error deleting Daily Log:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
