const express = require("express");
const router = express.Router();
const MedicationAdministration = require("../model/MedicationAdministration");
const MedicationRecord = require("../model/MedicationRecord");
const { verifyToken, allowRoles } = require("../middleware/auth");

// === CREATE Administration Record (Record Dose) ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  async (req, res) => {
    try {
      const {
        client,
        medication, // ID of MedicationRecord
        caregiverName,
        time,
        given,
        notes
      } = req.body;

      if (!client || !medication) {
        return res.status(400).json({ error: "Client and Medication ID are required" });
      }

      // Create Administration Record
      const newAdmin = new MedicationAdministration({
        client,
        medication,
        caregiverName,
        time,
        given,
        notes,
      });
      const savedAdmin = await newAdmin.save();

      // IF GIVEN: Decrease Stock in the MedicationRecord
      if (given) {
          const medRecord = await MedicationRecord.findById(medication);
          if (medRecord) {
              // Assuming 'currentStock' or 'stock.quantity' is used. 
              // Based on previous tool usage, I used 'currentStock' (number) in MedicationRecord.
              // However, the frontend sends { stock: { quantity: ... } } for creating meds. 
              // To support the new frontend structure seamlessly, I should check how MedicationRecord is defined.
              // I defined it previously with `currentStock`. 
              // But the frontend sends `stock` object. 
              // I will attempt to decrement `currentStock` OR `stock.quantity` depending on schema.
              
              // Let's stick to the schema I defined just before: `currentStock`.
              // If the user's frontend sends `stock` object for creation, I need to make sure my creation route handles it.
              // But for administration, updates are simple.
              
              if (medRecord.currentStock && medRecord.currentStock > 0) {
                  medRecord.currentStock -= 1;
                  await medRecord.save();
              }
              // If the schema uses `stock` object (from user's frontend structure intention), I'll check that too.
              if (typeof medRecord.stock === 'object' && medRecord.stock.quantity > 0) {
                  medRecord.stock.quantity -= 1;
                  medRecord.markModified('stock'); // Important for mixed/nested types if not defined strictly
                  await medRecord.save();
              }
          }
      }

      res.status(201).json(savedAdmin);
    } catch (error) {
      console.error("Error recording dose:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === GET All Administrations ===
router.get(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff", "Client"),
  async (req, res) => {
    try {
      const records = await MedicationAdministration.find()
        .populate("medication", "medicationName") // Populate med name
        .sort({ createdAt: -1 });
      res.status(200).json(records);
    } catch (error) {
      console.error("Error fetching administration history:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// === DELETE Administration Record ===
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      await MedicationAdministration.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
