const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authenticateToken } = require('../middleware/auth');

// All friend routes require authentication
router.post('/fetchUserV2', authenticateToken, friendController.fetchUser);
router.post('/sendFriendRequest', authenticateToken, friendController.sendFriendRequest);
router.post('/getFriends', authenticateToken, friendController.getFriends);

module.exports = router;
