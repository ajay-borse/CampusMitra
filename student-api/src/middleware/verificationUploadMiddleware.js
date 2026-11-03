const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Private storage directory for sensitive student ID documents
const studentIdUploadDir = path.join(__dirname, '../../uploads/student_ids');
if (!fs.existsSync(studentIdUploadDir)) {
  fs.mkdirSync(studentIdUploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, studentIdUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = 'id-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Strict file type validation
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const ext = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mime = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are permitted for student ID'));
  }
};

const uploadStudentId = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

module.exports = uploadStudentId;
