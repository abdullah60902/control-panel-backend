const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: 'dgafrctb0',
  api_key: '366995947314162',
  api_secret: 'bQ65RzHV_TIGE7LdpKWpp7O2HPQ'
});
// ✅ Multer storage setup with full format support (images + videos + PDFs)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'careplans',       // Folder name in Cloudinary
      resource_type: 'auto',     // 🔹 Auto detect (image/video/pdf)
      public_id: file.originalname.split('.')[0], // Optional: use filename as public ID
      // allowed_formats is not needed when using resource_type: 'auto'
    };
  },
});

module.exports = {
  cloudinary,
  storage
};
