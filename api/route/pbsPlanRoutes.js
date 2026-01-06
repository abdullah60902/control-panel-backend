const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PBSPlan = require("../model/PBSPlan");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE PBS Plan ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        clientId, // Expecting clientId in body
        type,
        planTitle,
        nextReviewDate,
        status,
        hypothesisedFunction,
        targetBehaviours,
        settingEvents,
        generalApproach,
        skillDevelopment,
        earlyWarningSigns,
        step1Response,
        step1,
        step2Intervention,
        step2,
        step3HighRisk,
        step3,
        notes,
        frequency,
        assistanceLevel,
        dietType,
        sleepRoutine,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      // Handle aliased fields from different forms
      const finalStep1 = step1Response || step1;
      const finalStep2 = step2Intervention || step2;
      const finalStep3 = step3HighRisk || step3;

      const newPlan = new PBSPlan({
        client: clientId,
        type,
        planTitle,
        nextReviewDate,
        status: status || "Active",
        hypothesisedFunction,
        targetBehaviours,
        settingEvents,
        generalApproach,
        skillDevelopment,
        earlyWarningSigns,
        step1Response: finalStep1,
        step2Intervention: finalStep2,
        step3HighRisk: finalStep3,
        notes,
        frequency,
        assistanceLevel,
        dietType,
        sleepRoutine,
      });

      const savedPlan = await newPlan.save();
      res.status(201).json(savedPlan);
    } catch (error) {
      console.error("Error creating PBS Plan:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All PBS Plans for a Client ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "Family", "External"),
  async (req, res) => {
    try {
      const plans = await PBSPlan.find({ client: req.params.clientId }).sort({
        updatedAt: -1,
      });
      res.status(200).json(plans);
    } catch (error) {
      console.error("Error fetching PBS Plans:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
// === GET — PBS Plans older than 6 months ===
router.get(
  "/older-than-six-months",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External", "Family"),
  async (req, res) => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      let query = { createdAt: { $lt: cutoff } };

      const plans = await PBSPlan.find(query)
        .populate("client", "fullName")
        .sort({ createdAt: -1 });

      res.status(200).json({ count: plans.length, cutoff: cutoff.toISOString(), plans });
    } catch (error) {
      console.error("Error fetching older PBS Plans:", error);
      res.status(500).json({ error: "Failed to fetch older PBS plans" });
    }
  }
);

// === UPDATE PBS Plan ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        type,
        planTitle,
        nextReviewDate,
        status,
        hypothesisedFunction,
        targetBehaviours,
        settingEvents,
        generalApproach,
        skillDevelopment,
        earlyWarningSigns,
        step1Response,
        step1,
        step2Intervention,
        step2,
        step3HighRisk,
        step3,
        notes,
        frequency,
        assistanceLevel,
        dietType,
        sleepRoutine,
      } = req.body;

      // Handle aliases
      const finalStep1 = step1Response !== undefined ? step1Response : step1;
      const finalStep2 =
        step2Intervention !== undefined ? step2Intervention : step2;
      const finalStep3 = step3HighRisk !== undefined ? step3HighRisk : step3;

      const updateData = {
        type,
        planTitle,
        nextReviewDate,
        status,
        hypothesisedFunction,
        targetBehaviours,
        settingEvents,
        generalApproach,
        skillDevelopment,
        earlyWarningSigns,
        notes,
        frequency,
        assistanceLevel,
        dietType,
        sleepRoutine,
      };

      // Only update step fields if they are provided (undefined check)
      if (finalStep1 !== undefined) updateData.step1Response = finalStep1;
      if (finalStep2 !== undefined) updateData.step2Intervention = finalStep2;
      if (finalStep3 !== undefined) updateData.step3HighRisk = finalStep3;

      const updatedPlan = await PBSPlan.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updatedPlan) {
        return res.status(404).json({ error: "PBS Plan not found" });
      }

      res.status(200).json(updatedPlan);
    } catch (error) {
      console.error("Error updating PBS Plan:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE PBS Plan ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const deletedPlan = await PBSPlan.findByIdAndDelete(req.params.id);
      if (!deletedPlan) {
        return res.status(404).json({ error: "PBS Plan not found" });
      }
      res.status(200).json({ message: "PBS Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting PBS Plan:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
