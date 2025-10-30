const express = require("express");
const router = express.Router();
const Compliance = require("../model/Compliance");
const AuditLog = require("../model/AuditLog");
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const upload = multer({ storage });

/* ============================
   ✅ CREATE COMPLIANCE
   ============================ */
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      console.log("FILES:", req.files);
      console.log("BODY:", req.body);

      const compliance = new Compliance({
        ...req.body,
        attachments: req.files?.map((file) => file.path),
        visibility: req.body.visibility, // ✅ new
      });

      const saved = await compliance.save();

      // ✅ Audit Log
      await AuditLog.create({
        user: req.user.email,
        action: "Created compliance",
        targetType: "Compliance",
        targetId: saved._id.toString(),
        requirement: saved.requirement,
        timestamp: new Date(),
        visibility: saved.visibility, // optional for tracking
      });

      res.status(201).json(saved);
    } catch (err) {
      console.error("❌ SERVER ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* ============================
   ✅ GET ALL COMPLIANCES (filtered by role)
   ============================ */
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External"),
  async (req, res) => {
    try {
      let query = {};

      // Role-based visibility filtering
      if (req.user.role === "Admin") query = {};
      else if (req.user.role === "Staff")
        query = { visibility: { $in: ["Staff", "Everyone"] } };
      else if (req.user.role === "External")
        query = { visibility: { $in: ["External", "Everyone"] } };
      else if (req.user.role === "Client")
        query = { visibility: { $in: ["Everyone"] } };

      const compliances = await Compliance.find(query);
      res.status(200).json(compliances);
    } catch (error) {
      console.error("Compliance Fetch Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/* ============================
   ✅ GET AUDIT LOGS
   ============================ */
router.get(
  "/audit-logs",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      const logs = await AuditLog.find().sort({ timestamp: -1 });
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

/* ============================
   ✅ GET ONE COMPLIANCE BY ID
   ============================ */
router.get(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff",  "External"),
  async (req, res) => {
    try {
      const compliance = await Compliance.findById(req.params.id);
      if (!compliance)
        return res.status(404).json({ error: "Compliance not found" });

      res.status(200).json(compliance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/* ============================
   ✅ UPDATE COMPLIANCE
   ============================ */
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existingCompliance = await Compliance.findById(req.params.id);
      if (!existingCompliance)
        return res.status(404).json({ error: "Compliance not found" });

      // Delete old attachments if new files uploaded
      if (req.files?.length > 0 && existingCompliance.attachments?.length > 0) {
        for (const url of existingCompliance.attachments) {
          try {
            const publicId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`compliances/${publicId}`);
          } catch (err) {
            console.warn(`Could not delete old file: ${url}`, err.message);
          }
        }
      }

      const updatedFields = {
        ...req.body,
        visibility: req.body.visibility, // ✅ new
        attachments:
          req.files?.map((file) => file.path) ||
          existingCompliance.attachments,
      };

      const updated = await Compliance.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
      );

      // ✅ Audit Log
      if (updated) {
        await AuditLog.create({
          user: req.user.email,
          action: "Updated compliance",
          targetType: "Compliance",
          targetId: updated._id.toString(),
          requirement: updated.requirement,
          timestamp: new Date(),
          visibility: updated.visibility,
        });
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error("Compliance Update Error:", error);
      res.status(500).json({ error: "Failed to update compliance" });
    }
  }
);

/* ============================
   ✅ DELETE COMPLIANCE
   ============================ */
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const compliance = await Compliance.findById(req.params.id);
      if (!compliance)
        return res.status(404).json({ error: "Compliance not found" });

      console.log("Cloudinary Config:", cloudinary.config());

      // Delete from Cloudinary
      const deletePromises = (compliance.attachments || []).map((url) => {
        const publicId = url.split("/").pop().split(".")[0];
        return cloudinary.uploader.destroy(`compliances/${publicId}`, {
          resource_type: "auto",
        });
      });

      await Promise.all(deletePromises);

      // Delete from MongoDB
      await Compliance.findByIdAndDelete(req.params.id);

      // Log deletion
      await AuditLog.create({
        user: req.user.email,
        action: "Deleted compliance",
        targetType: "Compliance",
        targetId: req.params.id,
        requirement: compliance.requirement,
        timestamp: new Date(),
        visibility: compliance.visibility,
      });

      res.json({
        message:
          "Compliance and attachments deleted from Cloudinary & MongoDB.",
      });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
