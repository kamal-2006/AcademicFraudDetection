const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');

/**
 * @route   POST /api/fraud-reports
 * @desc    Create a new fraud report
 * @access  Protected (add auth middleware when implemented)
 */
router.post('/', fraudController.createFraudReport);

/**
 * @route   POST /api/fraud-reports/bulk
 * @desc    Bulk create fraud reports
 * @access  Protected (add auth middleware when implemented)
 */
router.post('/bulk', fraudController.bulkCreateFraudReports);

/**
 * @route   GET /api/fraud-reports
 * @desc    Get all fraud reports with filtering and pagination
 * @access  Protected (add auth middleware when implemented)
 * @query   fraudType, studentId, status, riskLevel, startDate, endDate, page, limit, sortBy, sortOrder
 */
router.get('/', fraudController.getAllFraudReports);

/**
 * @route   GET /api/fraud-reports/statistics/summary
 * @desc    Get fraud reports statistics
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/statistics/summary', fraudController.getFraudStatistics);

/**
 * @route   GET /api/fraud-reports/export/csv
 * @desc    Export fraud reports to CSV
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/export/csv', fraudController.exportFraudReportsCSV);

/**
 * @route   GET /api/fraud-reports/export/json
 * @desc    Export fraud reports to JSON
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/export/json', fraudController.exportFraudReportsJSON);

/**
 * @route   GET /api/fraud-reports/high-risk
 * @desc    Get high-risk fraud reports (High and Critical)
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/high-risk', fraudController.getHighRiskReports);

/**
 * @route   GET /api/fraud-reports/recent
 * @desc    Get recent fraud reports within specified days
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/recent', fraudController.getRecentReports);

/**
 * @route   GET /api/fraud-reports/student/:studentId
 * @desc    Get all fraud reports for a specific student
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/student/:studentId', fraudController.getFraudReportsByStudent);

/**
 * @route   GET /api/fraud-reports/:id
 * @desc    Get a single fraud report by ID
 * @access  Protected (add auth middleware when implemented)
 */
router.get('/:id', fraudController.getFraudReportById);

/**
 * @route   PUT /api/fraud-reports/:id
 * @desc    Update a fraud report
 * @access  Protected (add auth middleware when implemented)
 */
router.put('/:id', fraudController.updateFraudReport);

/**
 * @route   DELETE /api/fraud-reports/:id
 * @desc    Delete a fraud report
 * @access  Protected (add auth middleware when implemented)
 */
router.delete('/:id', fraudController.deleteFraudReport);

module.exports = router;
