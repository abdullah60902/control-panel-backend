const express = require("express");
const router = express.Router();
const Hr = require("../model/Hr");
const Training = require("../model/Training");
const CarePlan = require("../model/CarePlanning");
const Medication = require("../model/Medication");
const { verifyToken, allowRoles } = require("../middleware/auth");

router.get(
  "/care-settings",
  verifyToken,
  allowRoles("Admin", "Staff", "External"), // ✅ Fixed roles
  async (req, res) => {
    try {
      const settings = [
        "Residential Care",
        "Nursing Homes",
        "Learning Disabilities",
        "Supported Living",
        "Mental Health Support",
        "Domiciliary Care",
        "Other Services",
      ];

      const now = new Date();
      const result = [];

      for (const careSetting of settings) {
        // === Staff ===
        const staff = await Hr.find({ careSetting });
        const staffIds = staff.map((s) => s._id);
        const totalStaff = staff.length;

        // === Clients via CarePlans ===
        const carePlans = await CarePlan.find({ careSetting }).populate("client");
        const clientIds = carePlans
          .map((plan) => plan.client?._id)
          .filter((id) => id);
        const uniqueClientIds = [...new Set(clientIds.map((id) => id.toString()))];
        const totalClients = uniqueClientIds.length;

        // === Trainings ===
        const trainings = await Training.find({ staffMember: { $in: staffIds } });
        const validTrainings = trainings.filter(
          (t) => new Date(t.expiryDate) > now
        ).length;
        const expiredTrainings = trainings.filter(
          (t) => new Date(t.expiryDate) <= now
        ).length;

        // === Medications ===
        const medications = await Medication.find({
          client: { $in: uniqueClientIds },
        });

        const totalMedications = medications.length;
        const lowStock = medications.filter(
          (m) => m.stock && m.stock.quantity < m.stock.threshold
        ).length;
        const completedMedications = medications.filter(
          (m) => m.status === "Completed"
        ).length;
        const pendingMedications = medications.filter(
          (m) => m.status === "Pending"
        ).length;

        // === Combine all data ===
        result.push({
          careSetting,
          totalStaff,
          totalClients,
          validTrainings,
          expiredTrainings,
          totalMedications,
          lowStock,
          completedMedications,
          pendingMedications,
        });
      }

      res.json(result);
    } catch (err) {
      console.error("❌ Analytics Fetch Error:", err);
      res.status(500).json({ error: "Analytics fetch failed" });
    }
  }
);

module.exports = router;
