const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All dashboard routes are protected
router.use(protect);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);
router.get('/trends', dashboardController.getDashboardTrends);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/high-risk-students', dashboardController.getHighRiskStudents);

module.exports = router;
