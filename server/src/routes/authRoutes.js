const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.get('/me', protect, authController.getProfile);

// Admin only routes (for initial setup or protected admin creation)
router.post('/create-admin', authController.createAdmin);

module.exports = router;
