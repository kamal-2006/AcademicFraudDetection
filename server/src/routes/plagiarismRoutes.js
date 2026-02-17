const express = require('express');
const router = express.Router();
const plagiarismController = require('../controllers/plagiarismController');
const { protect } = require('../middleware/auth');

// All plagiarism routes are protected
router.use(protect);

// Plagiarism CRUD operations
router.get('/', plagiarismController.getAllPlagiarismCases);
router.get('/stats/overview', plagiarismController.getPlagiarismStats);
router.get('/stats/high-score', plagiarismController.getHighScoreCases);
router.get('/:id', plagiarismController.getPlagiarismCaseById);
router.post('/', plagiarismController.createPlagiarismCase);
router.put('/:id', plagiarismController.updatePlagiarismCase);
router.delete('/:id', plagiarismController.deletePlagiarismCase);

module.exports = router;
