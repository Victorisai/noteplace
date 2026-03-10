const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  listConversations,
  searchFollowing,
  openConversation,
  listMessages,
  sendMessage,
} = require('../controllers/messages.controller');

const router = express.Router();

router.use(protect);

router.get('/conversations', listConversations);
router.get('/following', searchFollowing);
router.post('/conversations/with/:userId', openConversation);
router.get('/conversations/:conversationId/messages', listMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

module.exports = router;
