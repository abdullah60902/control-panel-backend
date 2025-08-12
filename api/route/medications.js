const express = require('express');
const router = express.Router();
const Medication = require('../model/Medication');
const Client = require('../model/client');

// ✅ Get all medications (with client info)
router.get('/', async (req, res) => {
  try {
    const medications = await Medication.find().populate('client');
    res.json(medications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// ✅ Get medications for a specific client
router.get('/client/:clientId', async (req, res) => {
  try {
    const medications = await Medication.find({ client: req.params.clientId }).populate('client');
    res.json(medications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client medications' });
  }
});

// ✅ Add a new medication
router.post('/', async (req, res) => {
  try {
    const { client, medicationName, schedule, stock } = req.body;

    const existingClient = await Client.findById(client);
    if (!existingClient) return res.status(404).json({ error: 'Client not found' });

    const newMedication = new Medication({
      client,
      medicationName,
      schedule,
      stock
    });

    await newMedication.save();
    res.status(201).json(newMedication);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to add medication' });
  }
});

// ✅ Update medication
router.put('/:id', async (req, res) => {
  try {
    const updated = await Medication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update medication' });
  }
});

// ✅ Delete medication
router.delete('/:id', async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medication deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// ✅ Record medication given
router.post('/:id/administer', async (req, res) => {
  const { date, time, given, caregiver } = req.body;
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });

    medication.history.push({ date, time, given, caregiver });
    await medication.save();
    res.json({ message: 'Administration recorded', medication });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record administration' });
  }
});

// ✅ Get low-stock medications
router.get('/low-stock', async (req, res) => {
  try {
    const allMeds = await Medication.find();
    const lowStock = allMeds.filter(med => med.stock.quantity < med.stock.threshold);
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock medications' });
  }
});

// ✅ Export medication history as CSV
router.get('/:id/history/export', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });

    const csv = medication.history.map(entry =>
      `${entry.date},${entry.time},${entry.given},${entry.caregiver}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${medication.medicationName}-history.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export history' });
  }
});

module.exports = router;
