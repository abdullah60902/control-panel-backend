const express = require("express");
const router = express.Router();
const Medication = require("../model/Medication");
const Client = require("../model/client");
const MedicationAdministration = require("../model/MedicationAdministration");
const AuditLog = require("../model/AuditLog");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === GET ALL ADMINISTRATIONS ===
router.get("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const records = await MedicationAdministration.find()
      .populate("client", "fullName")
      .populate("medication", "medicationName stock");
    res.status(200).json(records);
  } catch (err) {
    console.error("Fetch administration error:", err);
    res.status(500).json({ error: "Failed to fetch medication administration records" });
  }
});

// === GET PATIENTS WHO HAVE MEDICATIONS ===
router.get("/patients", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const meds = await Medication.find().populate("client", "fullName");
    const uniqueClients = [];
    const seen = new Set();
    for (const med of meds) {
      if (!seen.has(med.client._id.toString())) {
        uniqueClients.push(med.client);
        seen.add(med.client._id.toString());
      }
    }

    res.json(uniqueClients);
  } catch (err) {
    console.error("Fetch patients error:", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// === GET MEDICATIONS BY PATIENT ===
router.get("/medications/:clientId", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const meds = await Medication.find({ client: req.params.clientId }).select("medicationName stock");
    res.json(meds);
  } catch (err) {
    console.error("Fetch meds error:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

// === CREATE ADMINISTRATION RECORD ===
// === CREATE ADMINISTRATION RECORD ===
router.post("/", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const { client, caregiverName, medication, time } = req.body;

    // ✅ Convert string to boolean
    const given =
      req.body.given === true ||
      req.body.given === "true" ||
      req.body.given === "Yes";

    const med = await Medication.findById(medication);
    if (!med) return res.status(404).json({ error: "Medication not found" });

    const record = new MedicationAdministration({
      client,
      caregiverName,
      medication,
      time,
      given,
    });
    await record.save();

    if (given) {
      med.stock.quantity = Math.max(0, med.stock.quantity - 1);
      med.status = "Completed";
    }

    await med.save();

    res.status(201).json({
      message: "Medication administration recorded successfully",
      record,
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: err.message });
  }
});


// === UPDATE ADMINISTRATION RECORD ===
router.put("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const record = await MedicationAdministration.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });

    const { caregiverName, medication, time } = req.body;

    // ✅ Convert string to boolean
    const given =
      req.body.given === true ||
      req.body.given === "true" ||
      req.body.given === "Yes";

    const med = await Medication.findById(medication);
    if (!med) return res.status(404).json({ error: "Medication not found" });

    if (record.given && !given) med.stock.quantity += 1;
    if (!record.given && given)
      med.stock.quantity = Math.max(0, med.stock.quantity - 1);

    record.caregiverName = caregiverName;
    record.medication = medication;
    record.time = time;
    record.given = given;

    await record.save();
    await med.save();

    res.json({ message: "Record updated successfully", record });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: err.message });
  }
});


// === DELETE ADMINISTRATION RECORD ===
router.delete("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const record = await MedicationAdministration.findById(req.params.id).populate("medication");
    if (!record) return res.status(404).json({ error: "Record not found" });

    const med = record.medication;

    // ✅ If record was given, restore stock by 1
    if (record.given && med) {
      med.stock.quantity += 1;
      await med.save();
    }

    await MedicationAdministration.findByIdAndDelete(req.params.id);

    // ✅ Audit Log
    await AuditLog.create({
      user: req.user.email,
      action: "Deleted medication administration record",
      targetType: "MedicationAdministration",
      targetId: req.params.id,
      client: record.client,
      requirement: med ? med.medicationName : "Unknown",
      timestamp: new Date(),
    });

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
