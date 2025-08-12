const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dgafrctb0',
  api_key: '366995947314162',
  api_secret: 'bQ65RzHV_TIGE7LdpKWpp7O2HPQ'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'careplans',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

module.exports = {
  cloudinary,
  storage
};
