const express = require("express");
const router = express.Router();
const Hr = require("../model/Hr");
const { verifyToken, allowRoles } = require("../middleware/auth");
// ✅ Add new HR staff – Admin only
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });

router.post("/", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const newHr = new Hr(req.body);
    await newHr.save();
    res.status(201).json({ message: "HR Staff added", data: newHr });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// ✅ Get all HR staff – Admin & Staff
// ✅ Get all HR staff – Admin & Staff
// ✅ Get all HR staff – Admin & Staff
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "External"),
  async (req, res) => {
    try {
      let allHr;

      if (req.user.role === "Staff") {
        // 🧠 Staff ko sirf apna hi record dikhayega
        allHr = await Hr.find({ email: req.user.email }); 
      } else {
        // Admin aur External ko sab HRs milenge
        allHr = await Hr.find();
      }

      res.status(200).json({
        allHr,
        totalstaff: allHr.length,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Get HR staff by ID – Admin & Staff
router.get("/:id", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const hr = await Hr.findById(req.params.id);
    if (!hr) return res.status(404).json({ message: "Not found" });
    res.status(200).json(hr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Update HR staff by ID – Admin only
router.put("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const updatedHr = await Hr.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedHr) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Updated", data: updatedHr });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put("/:id/photo", verifyToken, upload.single("profileImage"), async (req, res) => {
  try {
    const updated = await Hr.findByIdAndUpdate(
      req.params.id,
      { profileImage: req.file.path },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Delete HR staff by ID – Admin only
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const deletedHr = await Hr.findByIdAndDelete(req.params.id);
    if (!deletedHr) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted", data: deletedHr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE staff and all related data
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const staffId = req.params.id;

    await Hr.findByIdAndDelete(staffId); // Delete HR
    await Training.deleteMany({ staffMember: staffId }); // Delete training
    await Documents.deleteMany({ staffId }); // Delete documents
    await Performance.deleteMany({ staffMember: staffId }); // Delete performance

    res.status(200).json({ message: "Staff and all related records deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
