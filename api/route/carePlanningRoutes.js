const express = require("express");
const router = express.Router();
const CarePlanning = require("../model/CarePlanning");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === USER ROLES ===
// Admin: Full control
// Staff: Can view/create/update care plans
// Client/Family: Can only view

// === CREATE — Admin, Staff ===
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const carePlan = new CarePlanning(req.body);
    const savedPlan = await carePlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === READ ALL — Admin, Staff, Client/Family ===
router.get("/", verifyToken, allowRoles("Admin", "Staff", "Client", "Family"), async (req, res) => {
   try {
    const carePlans = await CarePlanning.find().populate('client');
    res.json(carePlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === READ ONE — Admin, Staff, Client/Family ===
router.get("/:id", verifyToken, allowRoles("Admin", "Staff", "Client", "Family"), async (req, res) => {
  try {
    const carePlan = await CarePlanning.findById(req.params.id);
    if (!carePlan) return res.status(404).json({ error: "Care Plan not found" });
    res.json(carePlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === UPDATE — Admin, Staff ===
router.put("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const updatedPlan = await CarePlanning.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === DELETE — Only Admin ===
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    await CarePlanning.findByIdAndDelete(req.params.id);
    res.json({ message: "Care Plan deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
