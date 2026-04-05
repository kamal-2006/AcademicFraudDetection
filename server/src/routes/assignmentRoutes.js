const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { assignmentUpload, handleMulterError } = require('../middleware/upload');

router.use(protect);

// Student routes
router.get('/student/me', authorize('student'), ctrl.getLoggedInStudentDetails);
router.get('/assigned', authorize('student'), ctrl.getStudentAssignedAssignments);
router.post('/assigned/:assignmentId/submit', authorize('student'), assignmentUpload.single('file'), handleMulterError, ctrl.submitAssignedAssignment);
router.post('/', authorize('student'), assignmentUpload.single('file'), handleMulterError, ctrl.submitAssignment);
router.get('/my', authorize('student'), ctrl.getMyAssignments);
router.get('/my-report', authorize('student'), ctrl.getStudentPlagiarismReport);

// Faculty / Admin assignment management
router.get('/faculty/students', authorize('admin', 'faculty'), ctrl.getAssignableStudents);
router.post('/faculty/assigned', authorize('admin', 'faculty'), ctrl.createAssignedAssignment);
router.get('/faculty/assigned', authorize('admin', 'faculty'), ctrl.getFacultyAssignedAssignments);
router.get('/faculty/assigned/:assignmentId/submissions', authorize('admin', 'faculty'), ctrl.getFacultyAssignmentSubmissions);

// Admin / Faculty only
router.get('/plagiarism', authorize('admin', 'faculty'), ctrl.getPlagiarismCases);
router.get('/stats',      authorize('admin', 'faculty'), ctrl.getAssignmentStats);
router.get('/',           authorize('admin', 'faculty'), ctrl.getAllAssignments);

module.exports = router;
