const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Get all attendance records with filtering
router.get('/', attendanceController.getAttendanceRecords);

// Get attendance statistics
router.get('/stats/overview', attendanceController.getAttendanceStats);

// Get low attendance students
router.get('/stats/low-attendance', attendanceController.getLowAttendanceStudents);

// Get subjects list for filters
router.get('/filters/subjects', attendanceController.getSubjects);

// Get attendance by student ID
router.get('/student/:studentId', attendanceController.getAttendanceByStudentId);

// Create new attendance record
router.post('/', attendanceController.createAttendance);

// Update attendance record
router.put('/:id', attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
