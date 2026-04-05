const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.memoryStorage(); // Store file in memory for parsing

// File filter - only accept CSV files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only CSV files are allowed.'),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// ── Assignment upload (PDF, DOCX, TXT – up to 10 MB) ──────────────────────
const assignmentFileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
  }
};

const assignmentUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Certificate upload (PDF / image – up to 8 MB) ─────────────────────────
const certificateFileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or image files (JPG, JPEG, PNG, WEBP) are accepted for certificate upload.'), false);
  }
};

const certificateUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: certificateFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const isAssignmentUpload = req.originalUrl?.includes('/assignments');
      const isCertificateUpload = req.originalUrl?.includes('/certificates');
      return res.status(400).json({
        success: false,
        message: isAssignmentUpload
          ? 'File too large. Maximum file size is 10MB.'
          : isCertificateUpload
            ? 'File too large. Maximum file size is 8MB.'
            : 'File too large. Maximum file size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = { upload, assignmentUpload, certificateUpload, handleMulterError };
