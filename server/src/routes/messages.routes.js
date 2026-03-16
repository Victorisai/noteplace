const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { createUploader } = require('../middlewares/upload.middleware');
const {
  listConversations,
  searchFollowing,
  openConversation,
  listMessages,
  sendMessage,
  setConversationPinned,
  deleteConversation,
} = require('../controllers/messages.controller');

const router = express.Router();
const messageUpload = createUploader('messages', 1);

router.use(protect);

router.get('/conversations', listConversations);
router.get('/following', searchFollowing);
router.post('/conversations/with/:userId', openConversation);
router.get('/conversations/:conversationId/messages', listMessages);
router.post('/conversations/:conversationId/messages', messageUpload.single('image'), sendMessage);
router.patch('/conversations/:conversationId/pin', setConversationPinned);
router.delete('/conversations/:conversationId', deleteConversation);

module.exports = router;
