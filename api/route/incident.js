const express = require('express');
const router = express.Router();
const Incident = require('../model/incident');
const { verifyToken, allowRoles } = require('../middleware/auth');
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const upload = multer({ storage });
const User = require('../model/usermodel');
const extractPublicIdFromUrl = require("../utils/extractPublicId");

// ✅ CREATE new incident — Admin & Staff only
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const incident = new Incident({
        ...req.body,
        attachments: req.files?.map((f) => f.path),
      });

      const saved = await incident.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error("❌ CREATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ GET all incidents — returns counts for Open / Under Investigation / Resolved
router.get(
  "/all",
  verifyToken,
  allowRoles("Admin", "Staff", "External", "Client", "Family"),
  async (req, res) => {
    try {
      let incidents;

      // --- Admin, Staff, External → All incidents
      if (["Admin", "Staff", "External"].includes(req.user.role)) {
        incidents = await Incident.find().populate("client");
      }

      // --- Client or Family → Only assigned clients' incidents
      else if (["Client", "Family"].includes(req.user.role)) {
        const user = await User.findById(req.user._id).populate("clients");

        if (!user || !user.clients || user.clients.length === 0) {
          return res.status(200).json({
            incidents: [],
            openIncidentsCount: 0,
            underInvestigationCount: 0,
            resolvedIncidentsCount: 0,
            recentIncidentsCount: 0,
            recentIncidents: [],
          });
        }

        const allowedClientIds = user.clients.map((c) => c._id.toString());
        incidents = await Incident.find({
          client: { $in: allowedClientIds },
        }).populate("client");
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      // ✅ Calculate counts
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const openIncidentsCount = incidents.filter(
        (inc) => inc.status === "Open"
      ).length;

      const underInvestigationCount = incidents.filter(
        (inc) => inc.status === "Under Investigation"
      ).length;

      const resolvedIncidentsCount = incidents.filter(
        (inc) => inc.status === "Resolved"
      ).length;

      const recentIncidents = incidents.filter(
        (inc) => new Date(inc.createdAt) >= sixMonthsAgo
      );

      res.status(200).json({
        incidents,
        openIncidentsCount,
        underInvestigationCount,
        resolvedIncidentsCount,
        recentIncidentsCount: recentIncidents.length,
        recentIncidents,
      });
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ GET single incident by ID
router.get('/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('client');
    if (!incident) return res.status(404).json({ msg: 'Incident not found' });
    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE incident (replace attachments on Cloudinary)
router.put(
  '/update/:id',
  verifyToken,
  allowRoles('Admin', 'Staff'),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existing = await Incident.findById(req.params.id);
      if (!existing) return res.status(404).json({ msg: 'Incident not found' });

      // Delete old files from Cloudinary if new ones uploaded
      if (req.files && req.files.length > 0 && existing.attachments?.length > 0) {
        for (const url of existing.attachments) {
          const publicId = extractPublicIdFromUrl(url);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }
      }

      const updates = { ...req.body };
      if (req.files && req.files.length > 0) {
        updates.attachments = req.files.map(f => f.path);
      }

      const updated = await Incident.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      ).populate('client');

      res.status(200).json(updated);
    } catch (err) {
      console.error("❌ UPDATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ DELETE incident + attachments from Cloudinary
router.delete(
  '/delete/:id',
  verifyToken,
  allowRoles('Admin'),
  async (req, res) => {
    try {
      const deleted = await Incident.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ msg: 'Incident not found' });

      // Remove Cloudinary attachments
      if (deleted.attachments && deleted.attachments.length > 0) {
        for (const url of deleted.attachments) {
          const publicId = extractPublicIdFromUrl(url);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }
      }

      res.status(200).json({ msg: 'Incident and attachments deleted successfully' });
    } catch (err) {
      console.error("❌ DELETE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
