const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

// All test routes require authentication
router.use(protect);

// Questions
router.get('/questions', testController.getQuestions);

// Sessions
router.post('/sessions', testController.startSession);
router.get('/sessions/:id', testController.getSessionDetail);
router.get('/sessions/:id/heartbeat', testController.getSessionHeartbeat);
router.put('/sessions/:id/submit', testController.submitSession);
router.post('/sessions/:id/fraud', testController.logFraudEvent);

// Results
router.get('/my-results', testController.getMyResults);

// Admin / Faculty: all quiz results
router.get(
  '/results/all',
  authorize('admin', 'faculty'),
  testController.getAllTestResults
);

// Note an alert
router.put(
  '/logs/:logId/note',
  authorize('admin', 'faculty'),
  testController.markLogAsNoted
);

router.put(
  '/sessions/:id/note',
  authorize('admin', 'faculty'),
  testController.markSessionAsNoted
);

// Admin / Faculty: quiz fraud cases (flagged sessions)
router.get(
  '/fraud-cases',
  authorize('admin', 'faculty'),
  testController.getQuizFraudCases
);

// Admin / Faculty proctoring dashboard
router.get(
  '/proctoring/logs',
  authorize('admin', 'faculty'),
  testController.getAllProctoringLogs
);
router.get(
  '/proctoring/sessions',
  authorize('admin', 'faculty'),
  testController.getProctoringSessionSummary
);

// Frame analysis proxy → Python proctoring service
router.post('/proctoring/analyze', testController.analyzeFrame);

module.exports = router;

