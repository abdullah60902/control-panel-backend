const express = require("express");
const router = express.Router();
const CarePlanning = require("../model/CarePlanning");
const AuditLog = require("../model/creplainAudit"); // ✅ AuditLog import
const { verifyToken, allowRoles } = require("../middleware/auth");
const { storage, cloudinary } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage });

const Client = require('../model/client');
const User = require('../model/usermodel');
// === ✅ GET ALERTS: Overdue & Due Today ===
// === Get Alerts (Today + Overdue) ===
// === ✅ GET ALERTS: Overdue & Due Today ===
// === ALERTS ROUTE — Review Date Notifications ===
router.get(
  "/alerts",
  verifyToken,
  allowRoles("Admin", "Staff", "Client", "External"),
  async (req, res) => {
    try {
      // 👇 Current date without time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 👇 Next day (for today's comparison)
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 🔹 Find today's review plans
      const todayReviews = await CarePlanning.find({
        reviewDate: { $gte: today, $lt: tomorrow },
        reviewStatus: "Pending Review",
      }).populate("client", "fullName");

      // 🔹 Find overdue plans (before today)
      const overdueReviews = await CarePlanning.find({
        reviewDate: { $lt: today },
        reviewStatus: "Pending Review",
      }).populate("client", "fullName");

      // 🔹 Prepare counts and response
      const totalToday = todayReviews.length;
      const totalOverdue = overdueReviews.length;
      const hasAlerts = totalToday > 0 || totalOverdue > 0;

      res.status(200).json({
        todayReviews,
        overdueReviews,
        totalToday,
        totalOverdue,
        hasAlerts,
      });
    } catch (error) {
      console.error("❌ CarePlan Alerts Error:", error);
      res.status(500).json({ error: "Failed to fetch care plan alerts" });
    }
  }
);


// ✅ PUT — Mark as Reviewed
// ✅ PUT — Mark as Reviewed (Only Admin, Staff)
router.put("/:id/mark-reviewed", verifyToken, allowRoles("Admin", "Staff"), async (req, res) => {
  try {
    const plan = await CarePlanning.findById(req.params.id).populate("client");
    if (!plan) return res.status(404).json({ message: "Care plan not found" });

    plan.reviewStatus = "Reviewed";
    plan.reviewedOn = new Date();
    await plan.save();

    // ✅ Audit log
    await AuditLog.create({
      user: req.user.email,
      action: "Marked care plan as reviewed",
      targetType: "CarePlanning",
      targetId: plan._id.toString(),
      client: plan.client?._id,
      timestamp: new Date(),
    });

    res.status(200).json({ 
      message: `Care plan for ${plan.client?.name || "Unknown Client"} marked as reviewed` 
    });
  } catch (error) {
    console.error("Error marking reviewed:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// === CREATE — Admin, Staff ===
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      console.log("FILES:", req.files);
      console.log("BODY:", req.body);

      const carePlan = new CarePlanning({
        ...req.body,
        attachments: req.files?.map((file) => file.path),
      });

      const saved = await carePlan.save();

      // ✅ Audit log create
      await AuditLog.create({
        user: req.user.email,
        action: "Created care plan",
        targetType: "CarePlanning",
        targetId: saved._id.toString(),
        client: saved.client,
        timestamp: new Date()
      });

      res.status(201).json(saved);
    } catch (err) {
      console.error("❌ SERVER ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// === READ ALL — Admin, Staff, Client/Family ===
// === READ ALL — Admin, Staff, Client/Family ===
router.get("/", verifyToken, allowRoles("Admin", "Staff", "Client", "Family", "External"), async (req, res) => {
  try {
    let carePlans;

    // --- Admin, Staff & External: See all care plans
    if (req.user.role === "Admin" || req.user.role === "Staff" || req.user.role === "External") {
      carePlans = await CarePlanning.find().populate("client");

    // --- Client: Only see care plans linked to their assigned clients
    } else if (req.user.role === "Client") {
      // 🔹 Find the latest user data to ensure client assignment is up to date
      const user = await User.findById(req.user._id).populate("clients");

      if (!user || !user.clients || user.clients.length === 0) {
        return res.status(200).json([]); // no clients assigned
      }

      // 🔹 Extract the list of client IDs linked to this user
      const allowedClientIds = user.clients.map((c) => c._id);

      // 🔹 Find care plans that belong to those clients
      carePlans = await CarePlanning.find({
        client: { $in: allowedClientIds },
      }).populate("client");

    } else {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    res.status(200).json(carePlans);
  } catch (error) {
    console.error("CarePlanning Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get(
  "/audit-logs",
  verifyToken,
  allowRoles("Admin", "Staff", "External"), // ✅ Added External
  async (req, res) => {
    try {
      let logs;

      if (req.user.role === "Admin" || req.user.role === "Staff") {
        // Admin & Staff can see all logs
        logs = await AuditLog.find()
          .populate("client")
          .sort({ timestamp: -1 });
      } else if (req.user.role === "External") {
        // External can only see logs of clients they are attached to
        if (!req.user.clients || req.user.clients.length === 0) {
          return res.status(200).json([]); // No attached clients
        }

        logs = await AuditLog.find({
          client: { $in: req.user.clients },
        })
          .populate("client")
          .sort({ timestamp: -1 });
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      res.status(200).json(logs);
    } catch (error) {
      console.error("❌ Audit log fetch error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

// === READ ONE — Admin, Staff, Client/Family ===
router.get("/:id", verifyToken, allowRoles("Admin", "Staff", "Client", "Family"), async (req, res) => {
  try {
    const carePlan = await CarePlanning.findById(req.params.id);
    if (!carePlan) return res.status(404).json({ error: "Care Plan not found" });
    res.json(carePlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === UPDATE — Admin, Staff ===
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff", "Client"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const isStatusUpdate =
        req.body.status && !req.body.planType && !req.body.creationDate;

      if (isStatusUpdate) {
        const updateData = {};
        if (req.body.status === "Accepted") {
          updateData.status = "Accepted";
          updateData.signature = req.body.signature;
        } else if (req.body.status === "Declined") {
          updateData.status = "Declined";
          updateData.declineReason = req.body.declineReason;
        }

        const updatedPlan = await CarePlanning.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: false }
        );

        // ✅ Audit log
        if (updatedPlan) {
          await AuditLog.create({
            user: req.user.email,
            action: "Updated care plan",
            targetType: "CarePlanning",
            targetId: updatedPlan._id.toString(),
            client: updatedPlan.client,
            timestamp: new Date()
          });
        }

        return res.status(200).json(updatedPlan);
      }

      const existingPlan = await CarePlanning.findById(req.params.id);
      if (!existingPlan) {
        return res.status(404).json({ error: "Care Plan not found" });
      }

      if (req.files?.length > 0 && existingPlan.attachments?.length > 0) {
        for (const url of existingPlan.attachments) {
          try {
            const publicId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`careplans/${publicId}`);
          } catch (err) {
            console.warn(`Could not delete old file: ${url}`, err.message);
          }
        }
      }

     const updatedFields = {
  ...req.body,
  attachments: req.files?.map(file => file.path) || existingPlan.attachments,
};

// ✅ If reviewDate changed, reset reviewStatus
if (req.body.reviewDate && req.body.reviewDate !== existingPlan.reviewDate.toISOString()) {
  updatedFields.reviewStatus = "Pending Review";
  updatedFields.reviewedOn = null;
}


      const updatedPlan = await CarePlanning.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
      );

      // ✅ Audit log
      if (updatedPlan) {
        await AuditLog.create({
          user: req.user.email,
          action: "Updated care plan",
          targetType: "CarePlanning",
          targetId: updatedPlan._id.toString(),
          client: updatedPlan.client,
          timestamp: new Date()
        });
      }

      return res.status(200).json(updatedPlan);
    } catch (error) {
      console.error("CarePlan Update Error:", error);
      return res.status(500).json({ error: "Failed to update care plan" });
    }
  }
);

// === DELETE — Only Admin ===
router.delete("/:id", verifyToken, allowRoles("Admin"), async (req, res) => {
  try {
    const carePlan = await CarePlanning.findById(req.params.id);
    if (!carePlan) return res.status(404).json({ error: "Care Plan not found" });

    const deletePromises = (carePlan.attachments || []).map((url) => {
      const parts = url.split('/');
      const publicIdWithExtension = parts.slice(-2).join('/');
      const publicId = publicIdWithExtension.split('.').slice(0, -1).join('.');
      return cloudinary.uploader.destroy(publicId);
    });

    await Promise.all(deletePromises);

    await CarePlanning.findByIdAndDelete(req.params.id);

    // ✅ Audit log
    await AuditLog.create({
      user: req.user.email,
      action: "Deleted care plan",
      targetType: "CarePlanning",
      targetId: req.params.id,
      client: carePlan.client,
      timestamp: new Date()
    });

    res.json({ message: "Care Plan and its attachments deleted from Cloudinary and MongoDB." });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
