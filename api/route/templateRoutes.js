const express = require("express");
const router = express.Router();
const Template = require("../model/Template"); // your model file path
const { verifyToken, allowRoles } = require("../middleware/auth");
const multer = require("multer");
const { cloudinary, storage } = require("../utils/cloudinary");
const upload = multer({ storage });


// ✅ CREATE TEMPLATE — Admin & Staff
router.post(
  "/",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      console.log("📤 Uploading template files:", req.files);

      const uploadedBy = req.user._id;
      const attachments = req.files?.map((file) => file.path) || [];

      const newTemplate = new Template({
        title: req.body.title,
        attachments,
        visibility: req.body.visibility || "Admin Only",
        uploadedBy,
      }); 

      const saved = await newTemplate.save();
      res.status(201).json(saved);
    } catch (error) {
      console.error("❌ Error creating template:", error);
      res.status(500).json({ error: error.message });
    }
  }
);


// ✅ GET ALL TEMPLATES (Based on Role & Visibility)
router.get("/", verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "Admin") {
      query = {}; // Admin can see all
    } else if (req.user.role === "Staff") {
      query = {
        $or: [{ visibility: "Staff and Admin" }, { visibility: "Everyone" }],
      };
    } else {
      query = { visibility: "Everyone" };
    }

    const templates = await Template.find(query)
      .populate("uploadedBy", "email role")
      .sort({ createdAt: -1 });

    res.status(200).json(templates);
  } catch (error) {
    console.error("❌ Error fetching templates:", error);
    res.status(500).json({ error: error.message });
  }
});


// ✅ GET SINGLE TEMPLATE BY ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate("uploadedBy", "email role");

    if (!template) return res.status(404).json({ error: "Template not found" });

    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ UPDATE TEMPLATE (Admin, Staff)
router.put(
  "/:id",
  verifyToken,
  allowRoles("Admin", "Staff"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const existingTemplate = await Template.findById(req.params.id);
      if (!existingTemplate)
        return res.status(404).json({ error: "Template not found" });

      // ✅ If new files uploaded, delete old ones from Cloudinary
      if (req.files?.length > 0 && existingTemplate.attachments?.length > 0) {
        for (const url of existingTemplate.attachments) {
          try {
            const publicId = url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`careplans/${publicId}`);
          } catch (err) {
            console.warn(`⚠️ Could not delete old file: ${url}`, err.message);
          }
        }
      }

      const updatedFields = {
        title: req.body.title || existingTemplate.title,
        visibility: req.body.visibility || existingTemplate.visibility,
        attachments:
          req.files?.map((file) => file.path) || existingTemplate.attachments,
      };

      const updatedTemplate = await Template.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
      );

      res.status(200).json(updatedTemplate);
    } catch (error) {
      console.error("❌ Template update error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);


// ✅ DELETE TEMPLATE (Only Admin)
router.delete(
  "/:id",
  verifyToken,
  allowRoles("Admin"),
  async (req, res) => {
    try {
      const template = await Template.findById(req.params.id);
      if (!template) return res.status(404).json({ error: "Template not found" });

      // Delete attachments from Cloudinary
      const deletePromises = (template.attachments || []).map((url) => {
        const publicId = url.split("/").pop().split(".")[0];
        return cloudinary.uploader.destroy(`careplans/${publicId}`);
      });

      await Promise.all(deletePromises);

      await Template.findByIdAndDelete(req.params.id);

      res.json({ message: "Template and attachments deleted successfully" });
    } catch (error) {
      console.error("❌ Delete error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
// ✅ UPDATE training with optional new attachments