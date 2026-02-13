const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { upload, handleMulterError } = require('../middleware/upload');

// CSV Upload
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  studentController.uploadCSV
);

// Debug CSV (test parsing without saving)
router.post(
  '/debug-csv',
  upload.single('file'),
  handleMulterError,
  studentController.debugCSV
);

// Get all students with search and filter
router.get('/', studentController.getStudents);

// Get risk statistics
router.get('/stats/risk', studentController.getRiskStats);

// Get departments list for filters
router.get('/filters/departments', studentController.getDepartments);

// Get student by student ID
router.get('/studentId/:studentId', studentController.getStudentByStudentId);

// Get single student by MongoDB ID
router.get('/:id', studentController.getStudentById);

// Update student
router.put('/:id', studentController.updateStudent);

// Delete student
router.delete('/:id', studentController.deleteStudent);

// Delete all students (admin/testing only - should be protected in production)
router.delete('/bulk/all', studentController.deleteAllStudents);

module.exports = router;
