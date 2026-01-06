const express = require("express");
const router = express.Router();
const Handover = require("../model/Handover");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Handover Record ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        clientId,
        date,
        time,
        handingOver,
        takingOver,
        summaryNotes,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const newHandover = new Handover({
        client: clientId,
        date,
        time,
        handingOver,
        takingOver,
        summaryNotes,
        status: "Active",
      });

      const savedHandover = await newHandover.save();
      res.status(201).json(savedHandover);
    } catch (error) {
      console.error("Error creating Handover:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Handover Records for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      // Sort by date descending, then time descending if possible, or just date
      const handovers = await Handover.find({ client: req.params.clientId }).sort({
        date: -1,
        createdAt: -1
      });
      res.status(200).json(handovers);
    } catch (error) {
      console.error("Error fetching Handovers:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET — Handover Records older than 6 months ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      const handovers = await Handover.find({
        date: { $lt: cutoff }
      })
        .populate("client", "fullName")
        .sort({ date: -1 });

      res.status(200).json({
        count: handovers.length,
        cutoff: cutoff.toISOString(),
        handovers,
      });
    } catch (error) {
      console.error("Error fetching older Handovers:", error);
      res.status(500).json({ error: "Failed to fetch older handovers" });
    }
  }
);

// === UPDATE Handover Record ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const updatedHandover = await Handover.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedHandover) {
        return res.status(404).json({ error: "Handover not found" });
      }

      res.status(200).json(updatedHandover);
    } catch (error) {
      console.error("Error updating Handover:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Handover Record ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedHandover = await Handover.findByIdAndDelete(req.params.id);
      if (!deletedHandover) {
        return res.status(404).json({ error: "Handover not found" });
      }
      res.status(200).json({ message: "Handover deleted successfully" });
    } catch (error) {
      console.error("Error deleting Handover:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
