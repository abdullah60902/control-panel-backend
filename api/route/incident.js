const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Incident = require('../model/incident');
const Client = require('../model/client');
const { verifyToken, allowRoles } = require('../middleware/auth'); // ✅ Import middleware
const incident = require('../model/incident');
const multer = require("multer");
const { storage,cloudinary  } = require("../utils/cloudinary");
const upload = multer({ storage });
// ✅ Create new incident — Admin and Staff only
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const activity = new incident({
        ...req.body,
        attachments: req.files?.map((f) => f.path),
      });

      const saved = await activity.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error("❌ CREATE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Get all incidents — Admin and Staff only
// ✅ Get all incidents — Admin, Staff, and Client
router.get('/all', verifyToken, allowRoles('Admin', 'Staff', 'Client'), async (req, res) => {
  try {
    let incidents;

    if (req.user.role === 'Admin' || req.user.role === 'Staff') {
      incidents = await Incident.find().populate('client');
    } else if (req.user.role === 'Client') {
      // ✅ Only fetch incidents linked to user's clients
      if (!req.user.clients || req.user.clients.length === 0) {
        return res.status(200).json({ incidents: [], openIncidentsCount: 0, recentIncidentsCount: 0, recentIncidents: [] });
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
});


// ✅ Get incident by ID — Admin and Staff only
router.get('/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('client');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Total Open incidents
    const openIncidentsCount = await Incident.countDocuments({ status: 'Open' });

    // Total incidents in the last 6 months
    const recentIncidents = await Incident.find({
      createdAt: { $gte: sixMonthsAgo }
    }).populate('client');

    if (!incident) return res.status(404).json({ msg: 'Incident not found' });
    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update incident by ID — Admin and Staff only
router.put('/update/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('client');
    res.status(200).json(updatedIncident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete incident — Admin only
router.delete('/delete/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const result = await Incident.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ msg: 'Incident not found' });
    res.status(200).json({ msg: 'Incident deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
