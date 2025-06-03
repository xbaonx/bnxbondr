const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/validateEmailAddress', userController.validateEmail);
router.post('/sendVerificationCode', userController.sendVerificationCode);
router.post('/sendPasswordResetEmail', userController.sendPasswordResetEmail);

// Protected routes - require authentication
router.post('/validateUsername', authenticateToken, userController.validateUsername);
router.post('/changeProfileInfo', authenticateToken, userController.changeProfileInfo);

module.exports = router;
