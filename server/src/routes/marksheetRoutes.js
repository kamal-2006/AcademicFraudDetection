const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { marksheetUpload, handleMulterError } = require('../middleware/upload');
const ctrl = require('../controllers/marksheetController');

// Student: upload their own marksheet
router.post(
  '/',
  protect,
  authorize('student'),
  marksheetUpload.single('file'),
  handleMulterError,
  ctrl.uploadMarksheet,
);

// Student: list own uploads
router.get('/my', protect, authorize('student'), ctrl.getMyMarksheets);

// Admin/Faculty: all uploads
router.get('/', protect, authorize('admin', 'faculty'), ctrl.getAllMarksheets);

module.exports = router;
