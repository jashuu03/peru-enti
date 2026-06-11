const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, reportMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);
router.post('/report', reportMessage);

module.exports = router;
