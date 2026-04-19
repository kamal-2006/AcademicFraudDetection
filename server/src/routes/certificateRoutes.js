const express = require('express');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { certificateUpload, handleMulterError } = require('../middleware/upload');
const ctrl = require('../controllers/certificateController');

router.post(
  '/',
  protect,
  authorize('student'),
  certificateUpload.single('file'),
  handleMulterError,
  ctrl.uploadCertificate,
);

router.get('/my', protect, authorize('student'), ctrl.getMyCertificates);
router.get('/', protect, authorize('admin', 'faculty'), ctrl.getAllCertificates);
router.get('/:id/file', protect, ctrl.getCertificateFile);
router.put('/:id/note', protect, authorize('admin', 'faculty'), ctrl.markAsNoted);

module.exports = router;