const express = require("express");
const router = express.Router();
const MedicationRecord = require("../model/MedicationRecord");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Medication Record ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        client, // Frontend sends "client" not "clientId" in handleCreateMedication
        medicationName,
        schedule, // Frontend sends { frequency, times }
        stock, // Frontend sends { quantity, threshold }
        status
      } = req.body;
      
      const clientId = client || req.body.clientId;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const newRecord = new MedicationRecord({
        client: clientId,
        medicationName,
        schedule, // Schema will need to be flexible or updated. Let's rely on Mongoose Mixed or define strict.
        // Ideally, we'd update schema to match `schedule: { frequency, times: [] }`
        stock, 
        status: status || "Pending",
      });

      const savedRecord = await newRecord.save();
      res.status(201).json(savedRecord);
    } catch (error) {
      console.error("Error creating Medication Record:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Medication Records for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      // Sort by lastGiven descending
      const records = await MedicationRecord.find({ client: req.params.clientId }).sort({
        lastGiven: -1,
        createdAt: -1
      });
      res.status(200).json(records);
    } catch (error) {
      console.error("Error fetching Medication Records:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET — Medication Records older than 6 months (based on Last Given) ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      const records = await MedicationRecord.find({
        $or: [
            { lastGiven: { $lt: cutoff, $ne: null } },
            { lastGiven: null, createdAt: { $lt: cutoff } }
        ]
      })
        .populate("client", "fullName")
        .sort({ lastGiven: -1 });

      res.status(200).json({
        count: records.length,
        cutoff: cutoff.toISOString(),
        records,
      });
    } catch (error) {
      console.error("Error fetching older Medication Records:", error);
      res.status(500).json({ error: "Failed to fetch older medication records" });
    }
  }
);

// === UPDATE Medication Record ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const updatedRecord = await MedicationRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Medication Record not found" });
      }

      res.status(200).json(updatedRecord);
    } catch (error) {
      console.error("Error updating Medication Record:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Medication Record ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedRecord = await MedicationRecord.findByIdAndDelete(req.params.id);
      if (!deletedRecord) {
        return res.status(404).json({ error: "Medication Record not found" });
      }
      res.status(200).json({ message: "Medication Record deleted successfully" });
    } catch (error) {
      console.error("Error deleting Medication Record:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
