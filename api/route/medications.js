const express = require("express");
const router = express.Router();
const Medication = require("../model/Medication");
const Client = require("../model/client");
const AuditLog = require("../model/AuditLog");
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const User = require('../model/usermodel');

const upload = multer({ storage });
// === CREATE — Admin, Staff ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const { client, caregiverName, medicationName, schedule, stock, status } = req.body;

      const existingClient = await Client.findById(client);
      if (!existingClient)
        return res.status(404).json({ error: "Client not found" });

      const newMedication = new Medication({
        client,
        caregiverName,
        medicationName,
        schedule,
        stock,
        status: status || "Pending",
        attachments: req.files?.map((file) => file.path),
      });

      const saved = await newMedication.save();

      // ✅ Audit log
      await AuditLog.create({
        user: req.user.email,
        action: "Created medication",
        targetType: "Medication",
        targetId: saved._id.toString(),
        client: saved.client,
        requirement: saved.medicationName,
        timestamp: new Date(),
      });

      res.status(201).json(saved);
    } catch (err) {
      console.error("Medication Create Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// === READ ALL — Admin, Staff ===
// === READ ALL — Role Based Access ===
router.get("/", verifyToken, allowRoles("Admin", "Staff", "External", "Client", "Family"), async (req, res) => {
  try {
    let medications;

    // --- Admin, Staff, External: See all medications
    if (["Admin", "Staff", "External"].includes(req.user.role)) {
      medications = await Medication.find().populate("client");

    // --- Client or Family: Only see medications linked to their assigned clients
    } else if (["Client", "Family"].includes(req.user.role)) {
      const user = await User.findById(req.user._id).populate("clients");

      if (!user || !user.clients || user.clients.length === 0) {
        return res.status(200).json([]); // No linked clients
      }

      // Get all client IDs attached to this user
      const allowedClientIds = user.clients.map((c) => c._id);

      // Fetch only medications for those clients
      medications = await Medication.find({
        client: { $in: allowedClientIds },
      }).populate("client");
    }

    res.status(200).json(medications);
  } catch (err) {
    console.error("Medication Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

// === READ BY CLIENT ===
router.get(
  "/client/:clientId",
  verifyToken,
  allowRoles("Admin", "Staff", "Client"),
  async (req, res) => {
    try {
      const medications = await Medication.find({
        client: req.params.clientId,
      }).populate("client");
      res.status(200).json(medications);
    } catch (err) {
      console.error("Medication Client Fetch Error:", err);
      res.status(500).json({ error: "Failed to fetch client medications" });
    }
  }
);

// === AUDIT LOGS — Admin, Staff ===
router.get(
  "/audit-logs",
  verifyToken,
  allowRoles("Admin", "Staff", "External"), // ✅ Added External
  async (req, res) => {
    try {
      const logs = await AuditLog.find({ targetType: "Medication" })
        .sort({ timestamp: -1 })
        .populate("client", "name");

      res.status(200).json(logs);
    } catch (error) {
      console.error("Audit Log Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch medication audit logs" });
    }
  }
);

// === UPDATE — Admin, Staff ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existing = await Medication.findById(req.params.id);
      if (!existing)
        return res.status(404).json({ error: "Medication not found" });

      if (req.files?.length > 0 && existing.attachments?.length > 0) {
        for (const url of existing.attachments) {
          try {
            const parts = url.split("/");
            const publicIdWithExtension = parts.slice(-2).join("/");
            const publicId = publicIdWithExtension.split(".").slice(0, -1).join(".");
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn(`⚠️ Could not delete old attachment: ${url}`, err.message);
          }
        }
      }

      const updatedFields = {
        ...req.body,
        attachments: req.files?.map((file) => file.path) || existing.attachments,
      };

      const updated = await Medication.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
      );

      // ✅ Audit log
      if (updated) {
        await AuditLog.create({
          user: req.user.email,
          action: "Updated medication",
          targetType: "Medication",
          targetId: updated._id.toString(),
          client: updated.client,
          requirement: updated.medicationName,
          timestamp: new Date(),
        });
      }

      res.status(200).json(updated);
    } catch (err) {
      console.error("Medication Update Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// === DELETE — Admin, Staff ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const medication = await Medication.findById(req.params.id);
      if (!medication)
        return res.status(404).json({ error: "Medication not found" });

      if (medication.attachments?.length > 0) {
        for (const url of medication.attachments) {
          try {
            const parts = url.split("/");
            const publicIdWithExtension = parts.slice(-2).join("/");
            const publicId = publicIdWithExtension.split(".").slice(0, -1).join(".");
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn(`⚠️ Could not delete file: ${url}`, err.message);
          }
        }
      }

      await Medication.findByIdAndDelete(req.params.id);

      // ✅ Audit log
      await AuditLog.create({
        user: req.user.email,
        action: "Deleted medication",
        targetType: "Medication",
        targetId: req.params.id,
        client: medication.client,
        requirement: medication.medicationName,
        timestamp: new Date(),
      });

      res.json({ message: "Medication and its attachments deleted successfully." });
    } catch (err) {
      console.error("Medication Delete Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// === LOW STOCK ===
// === LOW STOCK — Admin, Staff, External ===
router.get(
  "/low-stock",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      // ✅ Fetch all medications
      const allMeds = await Medication.find().populate("client", "name");

      // ✅ Filter low stock
      const lowStock = allMeds.filter(
        (med) => med.stock.quantity < med.stock.threshold
      );

      // ✅ Prepare response summary
      const response = {
        lowStockItems: lowStock,
        hasLowStock: lowStock.length > 0,   // true / false
        totalLowStock: lowStock.length,     // count
      };

      res.status(200).json(response);
    } catch (err) {
      console.error("Low Stock Error:", err);
      res.status(500).json({ error: "Failed to fetch low stock medications" });
    }
  }
);


// === RECORD ADMINISTRATION ===
router.post(
  "/:id/administer",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    const { date, time, given, caregiver } = req.body;
    try {
      const medication = await Medication.findById(req.params.id);
      if (!medication)
        return res.status(404).json({ error: "Medication not found" });

      // ✅ Save history
      medication.history.push({ date, time, given, caregiver });

      // ✅ Update status
      medication.status = given ? "Completed" : "Pending";

      // ✅ Decrease stock only if medication was given
      if (given === true || given === "true" || given === "Yes") {
        if (medication.stock && typeof medication.stock.quantity === "number") {
          medication.stock.quantity = Math.max(0, medication.stock.quantity - 1);
        }
      }

      await medication.save();

      // ✅ Audit log
      await AuditLog.create({
        user: req.user.email,
        action: given
          ? "Administered medication (stock -1)"
          : "Recorded pending administration",
        targetType: "Medication",
        targetId: medication._id.toString(),
        client: medication.client,
        requirement: medication.medicationName,
        timestamp: new Date(),
      });

      res.json({ message: "Administration recorded and stock updated", medication });
    } catch (err) {
      console.error("Administer Error:", err);
      res.status(500).json({ error: "Failed to record administration" });
    }
  }
);


// === EXPORT HISTORY CSV ===
router.get(
  "/:id/history/export",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const medication = await Medication.findById(req.params.id);
      if (!medication)
        return res.status(404).json({ error: "Medication not found" });

      const csv = medication.history
        .map(
          (entry) =>
            `${entry.date},${entry.time},${entry.given},${entry.caregiver}`
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${medication.medicationName}-history.csv"`
      );
      res.send(csv);

      // ✅ Audit log for export
      await AuditLog.create({
        user: req.user.email,
        action: "Exported medication history",
        targetType: "Medication",
        targetId: medication._id.toString(),
        client: medication.client,
        requirement: medication.medicationName,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Export History Error:", err);
      res.status(500).json({ error: "Failed to export history" });
    }
  }
);
// === DELETE MEDICATION AUDIT LOG — Admin Only ===
router.delete(
  "/audit-logs/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const log = await AuditLog.findById(req.params.id);
      if (!log)
        return res.status(404).json({ error: "Audit log not found" });

      await AuditLog.findByIdAndDelete(req.params.id);

      // ✅ Record deletion itself as an audit event
      await AuditLog.create({
        user: req.user.email,
        action: "Deleted medication audit log",
        targetType: "AuditLog",
        targetId: req.params.id,
        client: log.client,
        requirement: log.requirement,
        timestamp: new Date(),
      });

      res.json({ message: "Audit log deleted successfully" });
    } catch (err) {
      console.error("Audit Log Delete Error:", err);
      res.status(500).json({ error: "Failed to delete audit log" });
    }
  }
);


module.exports = router;
