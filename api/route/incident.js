const express = require('express');
const router = express.Router();
const Incident = require('../model/incident');
const { verifyToken, allowRoles } = require('../middleware/auth');
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const upload = multer({ storage });

const extractPublicIdFromUrl = require("../utils/extractPublicId");

// ✅ Create new incident — Admin and Staff only
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

// ✅ Get all incidents
router.get(
  '/all',
  verifyToken,
  allowRoles('Admin', 'Staff', 'Client'),
  async (req, res) => {
    try {
      let incidents;

      if (req.user.role === 'Admin' || req.user.role === 'Staff') {
        incidents = await Incident.find().populate('client');
      } else if (req.user.role === 'Client') {
        if (!req.user.clients || req.user.clients.length === 0) {
          return res.status(200).json({
            incidents: [],
            openIncidentsCount: 0,
            recentIncidentsCount: 0,
            recentIncidents: []
          });
        }

        incidents = await Incident.find({
          client: { $in: req.user.clients }
        }).populate('client');
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const openIncidentsCount = incidents.filter(inc => inc.status === 'Open').length;
      const recentIncidents = incidents.filter(inc => new Date(inc.createdAt) >= sixMonthsAgo);

      res.status(200).json({
        incidents,
        openIncidentsCount,
        recentIncidentsCount: recentIncidents.length,
        recentIncidents
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Get incident by ID
router.get('/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('client');
    if (!incident) return res.status(404).json({ msg: 'Incident not found' });
    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update incident by ID (replace attachments on Cloudinary)
router.put(
  '/update/:id',
  verifyToken,
  allowRoles('Admin', 'Staff'),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existing = await Incident.findById(req.params.id);
      if (!existing) return res.status(404).json({ msg: 'Incident not found' });

      // Agar naye files aye hain → purane delete karo
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

      const updated = await Incident.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('client');
      res.status(200).json(updated);
    } catch (err) {
      console.error("❌ UPDATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Delete incident (remove from DB + Cloudinary)
router.delete(
  '/delete/:id',
  verifyToken,
  allowRoles('Admin'),
  async (req, res) => {
    try {
      const deleted = await Incident.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ msg: 'Incident not found' });

      // Cloudinary se bhi delete karo
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
