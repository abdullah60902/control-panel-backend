const express = require("express");
const router = express.Router();
const Compliance = require("../model/Compliance");
const AuditLog = require("../model/AuditLog");

const { verifyToken, allowRoles } = require("../middleware/auth");

// Add new compliance record — only Admin or Staff
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const compliance = new Compliance(req.body);
    await compliance.save();
    await AuditLog.create({
  user: req.user.email,             // or req.user.id
  action: "Created compliance",
  targetType: "Compliance",
  targetId: compliance._id.toString(),
  requirement: compliance.requirement
});
    res.status(201).json({ message: "Compliance record created", data: compliance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all compliance records — Admin, Staff, Client can view
router.get("/", verifyToken, allowRoles("Admin", "Staff", "Client"), async (req, res) => {
  try {
    const compliances = await Compliance.find();
    res.status(200).json(compliances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs — Admin or Staff
router.get("/audit-logs", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/audit-logs/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const deleted = await AuditLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Audit log not found" });
    res.status(200).json({ message: "Audit log deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance by ID — Admin, Staff, Client can view
router.get("/:id", verifyToken, allowRoles("Admin", "Staff", "Client"), async (req, res) => {
  try {
    const compliance = await Compliance.findById(req.params.id);
    if (!compliance) return res.status(404).json({ message: "Not found" });
    res.status(200).json(compliance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update compliance record — Admin and Staff only
router.put("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const updated = await Compliance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
  user: req.user.email,
  action: "Updated compliance",
  targetType: "Compliance",
  targetId: req.params.id,
  requirement: updated.requirement
});
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Compliance updated", data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete compliance record — Admin only
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const deleted = await Compliance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
     await AuditLog.create({
      user: req.user.email,
      action: "Deleted compliance",
      targetType: "Compliance",
      targetId: req.params.id,
      requirement: deleted.requirement,
      timestamp: new Date()
    });
    res.status(200).json({ message: "Compliance deleted", data: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// delete audit log by ID — Admin onlys





module.exports = router;
