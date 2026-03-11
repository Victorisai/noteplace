const {
  getOrCreateConversation,
  listConversationsByUserId,
  listMessagesByConversation,
  searchFollowingForMessages,
  sendMessageToConversation,
  setConversationPinnedByUser,
  deleteConversationByIdForUser,
} = require('../services/messages.service');
const { emitMessageToUsers } = require('../socket');

async function listConversations(req, res) {
  try {
    const conversations = await listConversationsByUserId(req.user.id);
    return res.status(200).json({ conversations });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener conversaciones' });
  }
}

async function searchFollowing(req, res) {
  try {
    const users = await searchFollowingForMessages({
      userId: req.user.id,
      query: req.query.q || '',
    });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al buscar usuarios' });
  }
}

async function openConversation(req, res) {
  try {
    const conversation = await getOrCreateConversation({
      userId: req.user.id,
      otherUserId: Number(req.params.userId),
    });
    return res.status(200).json({ conversation });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al abrir conversación' });
  }
}

async function listMessages(req, res) {
  try {
    const data = await listMessagesByConversation({
      conversationId: Number(req.params.conversationId),
      userId: req.user.id,
      beforeId: req.query.before || null,
      limit: req.query.limit || 40,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener mensajes' });
  }
}

async function sendMessage(req, res) {
  try {
    const { message, recipientId } = await sendMessageToConversation({
      conversationId: Number(req.params.conversationId),
      senderId: req.user.id,
      content: req.body.content,
    });

    emitMessageToUsers({
      userIds: [req.user.id, recipientId],
      payload: { message },
    });

    return res.status(201).json({ message });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al enviar mensaje' });
  }
}

async function setConversationPinned(req, res) {
  try {
    const conversation = await setConversationPinnedByUser({
      conversationId: Number(req.params.conversationId),
      userId: req.user.id,
      pinned: req.body?.pinned,
    });
    return res.status(200).json({ conversation });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al fijar conversación' });
  }
}

async function deleteConversation(req, res) {
  try {
    await deleteConversationByIdForUser({
      conversationId: Number(req.params.conversationId),
      userId: req.user.id,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al borrar conversación' });
  }
}

module.exports = {
  listConversations,
  searchFollowing,
  openConversation,
  listMessages,
  sendMessage,
  setConversationPinned,
  deleteConversation,
};
