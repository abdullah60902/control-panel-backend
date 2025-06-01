const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Client = require('../model/client');
const { verifyToken, allowRoles } = require('../middleware/auth');

// Total rooms from 1 to 50
const TOTAL_ROOMS = Array.from({ length: 50 }, (_, i) => `${i + 1}`);

// ✅ CREATE — Only Admin or Staff
router.post('/', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  const { fullName, age, roomNumber, careType, admissionDate } = req.body;

  if (!fullName || !age || !roomNumber || !careType || !admissionDate) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Check if room is already taken
    const roomInUse = await Client.findOne({ roomNumber });
    if (roomInUse) {
      return res.status(400).json({ msg: `Room ${roomNumber} is already occupied.` });
    }

    const newClient = new Client({
      _id: new mongoose.Types.ObjectId(),
      fullName,
      age,
      roomNumber,
      careType,
      admissionDate: new Date(admissionDate)
    });

    const savedClient = await newClient.save();
    res.status(201).json({ msg: "Client added successfully", client: savedClient });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error while adding client" });
  }
});

// ✅ READ ALL — Admin, Staff, Client/Family
router.get('/', verifyToken, allowRoles('Admin', 'Staff', 'Client', 'Family'), async (req, res) => {
  try {
    const clients = await Client.find();
    const TOTAL_ROOMS = Array.from({ length: 50 }, (_, i) => (i + 1).toString()); // Rooms "1" to "50"
    const usedRooms = clients.map(client => client.roomNumber);

    const totalRooms = TOTAL_ROOMS.length;
    const currentOccupancy = usedRooms.length;
    const totalAvailableRooms = totalRooms - currentOccupancy;

    const occupancyPercentage = Math.round((currentOccupancy / totalRooms) * 100); // ✅ fixed

    res.status(200).json({
      clients,
      currentOccupancy,          // Number of rooms occupied
      totalAvailableRooms,   
            totalClients: clients.length,
    // Number of rooms still free
      occupancyPercentage,       // e.g., 76%
      availableRooms: TOTAL_ROOMS.filter(r => !usedRooms.includes(r)), // optional detail
      occupiedRooms: usedRooms   // optional detail
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error fetching clients" });
  }
});


// ✅ READ ONE — Admin, Staff, Client/Family
router.get('/:id', verifyToken, allowRoles('Admin', 'Staff', 'Client', 'Family'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE — Only Admin and Staff
router.put('/:id', verifyToken, allowRoles('Admin', 'Staff'), async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClient) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json({ msg: "Client updated", client: updatedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE — Only Admin
router.delete('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ msg: "Client not found" });
    res.status(200).json({ msg: "Client deleted", client: deletedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
