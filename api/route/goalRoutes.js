const express = require("express");
const router = express.Router();
const Goal = require("../model/Goal");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Goal ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        clientId,
        title,
        startDate,
        targetDate,
        metric,
        status,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const newGoal = new Goal({
        client: clientId,
        title,
        startDate,
        targetDate,
        metric,
        status: status || "Not Started",
        statusHistory: [{ status: status || "Not Started", changedBy: req.user.email }]
      });

      const savedGoal = await newGoal.save();
      res.status(201).json(savedGoal);
    } catch (error) {
      console.error("Error creating Goal:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Goals for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      const goals = await Goal.find({ client: req.params.clientId }).sort({
        createdAt: -1,
      });
      res.status(200).json(goals);
    } catch (error) {
      console.error("Error fetching Goals:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET — Goals older than 6 months (based on Start Date) ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      // We look for goals where startDate is before the cutoff
      const goals = await Goal.find({
        startDate: { $lt: cutoff },
      })
        .populate("client", "fullName")
        .sort({ startDate: -1 });

      res.status(200).json({
        count: goals.length,
        cutoff: cutoff.toISOString(),
        goals,
      });
    } catch (error) {
      console.error("Error fetching older Goals:", error);
      res.status(500).json({ error: "Failed to fetch older goals" });
    }
  }
);

// === UPDATE Goal ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const existingGoal = await Goal.findById(req.params.id);
      
      if (!existingGoal) {
          return res.status(404).json({ error: "Goal not found" });
      }

      // If status changed, push to history
      if (status && status !== existingGoal.status) {
          existingGoal.statusHistory.push({
              status,
              changedBy: req.user.email,
              changedAt: new Date()
          });
      }

      const updatedGoal = await Goal.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error("Error updating Goal:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Goal ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedGoal = await Goal.findByIdAndDelete(req.params.id);
      if (!deletedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(200).json({ message: "Goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting Goal:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
