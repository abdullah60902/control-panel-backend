const express = require("express");
const router = express.Router();
const multer = require("multer");
const {  cloudinary,storage } = require("../utils/cloudinary");
const upload = multer({ storage });

const StaffDocument = require("../model/StaffDocument");
const { verifyToken, allowRoles } = require("../middleware/auth");
const extractPublicIdFromUrl = require("../utils/extractPublicId");

// ==================
// CREATE Staff Document
// ==================
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.fields([
    { name: "employmentContracts" },
    { name: "dbsCertificates" },
    { name: "idDocuments" },
    { name: "trainingCertificates" },
    { name: "appraisalsReviews" },
    { name: "disciplinaryRecords" },
  ]),
  
  async (req, res) => {
    try {
      const staffDoc = new StaffDocument({
        staffName: req.body.staffName,
        expiryDate: req.body.expiryDate,
        notes: req.body.notes,

        employmentContracts: req.files?.employmentContracts?.map(f => f.path) || [],
        dbsCertificates: req.files?.dbsCertificates?.map(f => f.path) || [],
        idDocuments: req.files?.idDocuments?.map(f => f.path) || [],
        trainingCertificates: req.files?.trainingCertificates?.map(f => f.path) || [],
        appraisalsReviews: req.files?.appraisalsReviews?.map(f => f.path) || [],
        disciplinaryRecords: req.files?.disciplinaryRecords?.map(f => f.path) || [],
      });

      await staffDoc.save();
      res.status(201).json({ message: "Staff document added", data: staffDoc });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ==================
// GET all documents
// ==================
// GET all documents
const mongoose = require("mongoose");
// GET all staff documents
// Get staff documents
router.get('/', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "Staff") {
      const hrId = req.user.hr?._id || req.user.hr;
      if (!hrId) return res.status(400).json({ msg: "HR ID missing in token" });

      query.staffName = new mongoose.Types.ObjectId(hrId); // ✅ use 'new'
    }

    const documents = await StaffDocument.find(query)
      .populate('staffName', 'fullName email')
      .sort({ createdAt: -1 });

    if (!documents.length) return res.status(404).json({ msg: "Not found" });

    res.status(200).json(documents);
  } catch (err) {
    console.error("Error fetching staff documents:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==================
// UPDATE Staff Document (replace old files if uploaded)
// ==================
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  upload.fields([
    { name: "employmentContracts" },
    { name: "dbsCertificates" },
    { name: "idDocuments" },
    { name: "trainingCertificates" },
    { name: "appraisalsReviews" },
    { name: "disciplinaryRecords" },
  ]),
  async (req, res) => {
    try {
      const existing = await StaffDocument.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });

      const categories = [
        "employmentContracts",
        "dbsCertificates",
        "idDocuments",
        "trainingCertificates",
        "appraisalsReviews",
        "disciplinaryRecords",
      ];

      // Purane files delete aur naye replace
      for (const cat of categories) {
        if (req.files[cat]) {
          for (const url of existing[cat]) {
            const publicId = extractPublicIdFromUrl(url);
            if (publicId) await cloudinary.uploader.destroy(publicId);
          }
          existing[cat] = req.files[cat].map(f => f.path);
        }
      }

      existing.staffName = req.body.staffName || existing.staffName;
      existing.expiryDate = req.body.expiryDate || existing.expiryDate;
      existing.notes = req.body.notes || existing.notes;

      await existing.save();
      res.status(200).json({ message: "Staff document updated", data: existing });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
router.get("/staff/:id", verifyToken, async (req, res) => {
  try {
    const documents = await StaffDocument.find({ staffName: req.params.id })
      .populate("staffName", "fullName position email");

    if (!documents.length) {
      return res.status(404).json({ msg: "Not found" });
    }

    res.json(documents);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
});


// ==================
// DELETE Staff Document (delete Cloudinary files too)
// ==================
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const deleted = await StaffDocument.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });

    const allFiles = [
      ...deleted.employmentContracts,
      ...deleted.dbsCertificates,
      ...deleted.idDocuments,
      ...deleted.trainingCertificates,
      ...deleted.appraisalsReviews,
      ...deleted.disciplinaryRecords,
    ];

    for (const url of allFiles) {
      const publicId = extractPublicIdFromUrl(url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: "Staff document deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
