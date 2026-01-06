const express = require("express");
const router = express.Router();
const RiskAssessment = require("../model/RiskAssessment");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Risk Assessment ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        clientId,
        planTitle,
        dateOfAssessment,
        assessedBy,
        overallRiskLevel,
        categories,
        clinicalSummary,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const newAssessment = new RiskAssessment({
        client: clientId,
        planTitle,
        dateOfAssessment,
        assessedBy,
        overallRiskLevel,
        categories,
        clinicalSummary,
        status: "Active",
      });

      const savedAssessment = await newAssessment.save();
      res.status(201).json(savedAssessment);
    } catch (error) {
      console.error("Error creating Risk Assessment:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Risk Assessments for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      const assessments = await RiskAssessment.find({
        client: req.params.clientId,
      }).sort({ dateOfAssessment: -1 });
      res.status(200).json(assessments);
    } catch (error) {
      console.error("Error fetching Risk Assessments:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET — Risk Assessments older than 6 months ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      // Find documents where dateOfAssessment is older than 6 months
      const assessments = await RiskAssessment.find({
        dateOfAssessment: { $lt: cutoff },
      })
        .populate("client", "fullName")
        .sort({ dateOfAssessment: -1 });

      res.status(200).json({
        count: assessments.length,
        cutoff: cutoff.toISOString(),
        assessments,
      });
    } catch (error) {
      console.error("Error fetching older Risk Assessments:", error);
      res.status(500).json({ error: "Failed to fetch older risk assessments" });
    }
  }
);

// === UPDATE Risk Assessment ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const updatedAssessment = await RiskAssessment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedAssessment) {
        return res.status(404).json({ error: "Risk Assessment not found" });
      }

      res.status(200).json(updatedAssessment);
    } catch (error) {
      console.error("Error updating Risk Assessment:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Risk Assessment ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedAssessment = await RiskAssessment.findByIdAndDelete(
        req.params.id
      );
      if (!deletedAssessment) {
        return res.status(404).json({ error: "Risk Assessment not found" });
      }
      res
        .status(200)
        .json({ message: "Risk Assessment deleted successfully" });
    } catch (error) {
      console.error("Error deleting Risk Assessment:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
