const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Get all exam performance records with filtering
router.get('/', examController.getExamRecords);

// Get exam statistics
router.get('/stats/overview', examController.getExamStats);

// Get failing students
router.get('/stats/failing', examController.getFailingStudents);

// Get high-risk students based on exam performance
router.get('/stats/high-risk', examController.getHighRiskStudents);

// Get subjects list for filters
router.get('/filters/subjects', examController.getSubjects);

// Get exam types list for filters
router.get('/filters/exam-types', examController.getExamTypes);

// Get exam performance by student ID
router.get('/student/:studentId', examController.getExamsByStudentId);

// Create new exam performance record
router.post('/', examController.createExamRecord);

// Update exam performance record
router.put('/:id', examController.updateExamRecord);

// Delete exam performance record
router.delete('/:id', examController.deleteExamRecord);

module.exports = router;
