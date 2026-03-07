const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { assignmentUpload, handleMulterError } = require('../middleware/upload');

router.use(protect);

// Student routes
router.post('/',    assignmentUpload.single('file'), handleMulterError, ctrl.submitAssignment);
router.get('/my',   ctrl.getMyAssignments);

// Admin / Faculty only
router.get('/plagiarism', authorize('admin', 'faculty'), ctrl.getPlagiarismCases);
router.get('/stats',      authorize('admin', 'faculty'), ctrl.getAssignmentStats);
router.get('/',           authorize('admin', 'faculty'), ctrl.getAllAssignments);

module.exports = router;
