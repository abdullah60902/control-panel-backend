const express = require("express");
const router = express.Router();
const StaffPayInfo = require("../model/StaffPayInfo");
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { storage } = require("../utils/cloudinary");

const upload = multer({ storage });

// ---------------------------
// GET Pay Info
// ---------------------------
router.get("/:staffId", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const info = await StaffPayInfo.findOne({ staffId: req.params.staffId });
    res.json(info || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// UPDATE Pay Info
// ---------------------------
router.put("/:staffId", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const updateFields = req.body;
    const updated = await StaffPayInfo.findOneAndUpdate(
      { staffId: req.params.staffId },
      { $set: updateFields },
      { new: true, upsert: true }
    );
    res.json({ message: "Updated Successfully", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Upload Payslip
// ---------------------------
router.post("/:staffId/payslip", verifyToken, allowRoles("Admin"), upload.single("file"), async (req, res) => {
  try {
    const { period, fileDate } = req.body;
    const fileUrl = req.file?.path || "";

    const staff = await StaffPayInfo.findOne({ staffId: req.params.staffId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.payslips.push({ period, fileDate, fileUrl });
    await staff.save();

    res.json({ message: "Payslip uploaded", payslips: staff.payslips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Upload Timesheet
// ---------------------------
router.post("/:staffId/timesheet", verifyToken, allowRoles("Admin"), upload.single("file"), async (req, res) => {
  try {
    const { period, totalHours, status } = req.body;
    const fileUrl = req.file?.path || "";

    const staff = await StaffPayInfo.findOne({ staffId: req.params.staffId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.timesheets.push({ period, totalHours, status, fileUrl });
    await staff.save();

    res.json({ message: "Timesheet uploaded", timesheets: staff.timesheets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/:staffId/payslip/:index", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const { staffId } = req.params;
    const index = parseInt(req.params.index, 10);

    const staff = await StaffPayInfo.findOne({ staffId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const payslip = staff.payslips[index];
    if (payslip?.public_id) {
      await cloudinary.uploader.destroy(payslip.public_id);
    }

    staff.payslips.splice(index, 1);
    await staff.save();

    res.json({ message: "Payslip deleted", payslips: staff.payslips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ---------------------------
// Delete Timesheet
// ---------------------------
router.delete("/:staffId/timesheet/:index", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const { staffId } = req.params;
    const index = parseInt(req.params.index, 10); // Convert index to number

    const staff = await StaffPayInfo.findOne({ staffId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const timesheet = staff.timesheets[index];
    if (timesheet?.public_id) {
      await cloudinary.uploader.destroy(timesheet.public_id); // Delete file from Cloudinary
    }

    staff.timesheets.splice(index, 1); // Remove from array
    await staff.save();

    res.json({ message: "Timesheet deleted", timesheets: staff.timesheets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
