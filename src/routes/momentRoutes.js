const express = require('express');
const router = express.Router();
const momentController = require('../controllers/momentController');
const { authenticateToken } = require('../middleware/auth');

// All moment routes require authentication
router.post('/getLatestMomentV2', authenticateToken, momentController.getLatestMoments);
router.post('/createMoment', authenticateToken, momentController.createMoment);

module.exports = router;
