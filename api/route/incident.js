const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Incident = require('../model/incident');
const Client = require('../model/client');
const { verifyToken, allowRoles } = require('../middleware/auth'); // ✅ Import middleware

// ✅ Create new incident — Admin and Staff only
router.post('/', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const { incidentDate, client, incidentType, severity, reportedBy, incidentDetails } = req.body;

    const existingClient = await Client.findById(client);
    if (!existingClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    const newIncident = new Incident({
      _id: new mongoose.Types.ObjectId(),
      incidentDate,
      client,
      incidentType,
      severity,
      reportedBy,
      incidentDetails
    });

    const savedIncident = await newIncident.save();
    res.status(201).json(savedIncident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all incidents — Admin and Staff only
router.get('/all', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const incidents = await Incident.find().populate('client');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Total Open incidents
    const openIncidentsCount = await Incident.countDocuments({ status: 'Open' });

    // Total incidents in the last 6 months
    const recentIncidents = await Incident.find({
      createdAt: { $gte: sixMonthsAgo }
    }).populate('client');

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
