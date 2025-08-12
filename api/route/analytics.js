const express = require("express");
const router = express.Router();
const Hr = require("../model/Hr");
const Training = require("../model/Training");
const Client = require("../model/client");
const CarePlan = require("../model/CarePlanning");
const { verifyToken, allowRoles } = require("../middleware/auth");

router.get("/care-settings", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
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
      const staff = await Hr.find({ careSetting });
      const staffIds = staff.map(s => s._id);

      const totalStaff = staff.length;

      // Count clients through care plans that have this careSetting
      const carePlans = await CarePlan.find({ careSetting }).populate("client");
      const clientIds = carePlans.map(plan => plan.client?._id);
      const uniqueClientIds = [...new Set(clientIds.map(id => id?.toString()))]; // remove duplicates/nulls
      const totalClients = uniqueClientIds.length;

      const trainings = await Training.find({ staffMember: { $in: staffIds } });
      const validTrainings = trainings.filter(t => new Date(t.expiryDate) > now).length;
      const expiredTrainings = trainings.filter(t => new Date(t.expiryDate) <= now).length;

      result.push({
        careSetting,
        totalStaff,
        totalClients,
        validTrainings,
        expiredTrainings,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics fetch failed" });
  }
});

module.exports = router;
