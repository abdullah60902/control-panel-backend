const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = require('../model/client');
const User = require('../model/usermodel');
const { verifyToken, allowRoles } = require('../middleware/auth');
const multer = require("multer");
const {  cloudinary,storage } = require("../utils/cloudinary");
const upload = multer({ storage });

// Total rooms from 1 to 50
const TOTAL_ROOMS = Array.from({ length: 50 }, (_, i) => `${i + 1}`);

// ==========================================
// ✅ CREATE CLIENT  (Admin, Staff)
// ==========================================
router.post('/', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  const { fullName, age, roomNumber, careType, admissionDate, ...restFields } = req.body;

  if (!fullName || !age || !roomNumber || !careType || !admissionDate) {
    return res.status(400).json({ msg: "All required fields must be provided" });
  }

  try {
    // Check room availability
    const roomExists = await Client.findOne({ roomNumber });
    if (roomExists) {
      return res.status(400).json({ msg: `Room ${roomNumber} is already occupied.` });
    }

    const newClient = new Client({
      _id: new mongoose.Types.ObjectId(),
      fullName,
      age,
      roomNumber,
      careType,
      admissionDate: new Date(admissionDate),
      ...restFields // About Me fields and others
    });

    const savedClient = await newClient.save();
    res.status(201).json({ msg: "Client added successfully", client: savedClient });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error while adding client" });
  }
});

// ==========================================
// ✅ GET ALL CLIENTS  (Admin, Staff, Client, Family, External)
// ==========================================
router.get('/', verifyToken, allowRoles('Admin', 'Staff', 'Client', 'Family', 'External'), async (req, res) => {
  try {
    let clients;

    if (['Client', 'Family'].includes(req.user.role)) {
      const user = await User.findById(req.user._id).populate('clients');
      clients = user?.clients || [];
    } else if (['Admin', 'Staff', 'External'].includes(req.user.role)) {
      clients = await Client.find();
    } else {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const usedRooms = clients.map(c => c.roomNumber);

    res.status(200).json({
      clients,
      currentOccupancy: usedRooms.length,
      totalRooms: TOTAL_ROOMS.length,
      totalAvailableRooms: TOTAL_ROOMS.length - usedRooms.length,
      totalClients: clients.length,
      occupancyPercentage: Math.round((usedRooms.length / TOTAL_ROOMS.length) * 100),
      availableRooms: TOTAL_ROOMS.filter(r => !usedRooms.includes(r)),
      occupiedRooms: usedRooms
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ GET ONE CLIENT — (Admin, Staff, Client, Family, External)
// ==========================================
router.get('/:id', verifyToken, allowRoles('Admin', 'Staff', 'Client', 'Family', 'External'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ UPDATE CLIENT — (Admin, Staff)
// ==========================================
router.put('/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClient) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json({ msg: "Client updated", client: updatedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ DELETE CLIENT — (Admin)
// ==========================================
router.delete('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json({ msg: "Client deleted", client: deletedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ✅ UPLOAD / UPDATE CLIENT PROFILE IMAGE
// ==========================================
router.put('/:id/photo', verifyToken, allowRoles('Admin', 'Staff', 'Client'), upload.single('profileImage'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });

    if (!req.file || !req.file.path) {
      return res.status(400).json({ msg: 'No image file uploaded' });
    }

    // Save Cloudinary URL in client document
    client.profileImage = req.file.path;
    await client.save();

    res.status(200).json({ msg: 'Profile image updated', client });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error uploading image' });
  }
});


module.exports = router;
