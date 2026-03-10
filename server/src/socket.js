const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

function getTokenFromHandshake(socket) {
  const authToken = socket.handshake?.auth?.token;
  const queryToken = socket.handshake?.query?.token;
  const headerAuth = socket.handshake?.headers?.authorization;
  const candidate = authToken || queryToken || headerAuth || '';

  if (typeof candidate !== 'string') return '';
  if (candidate.startsWith('Bearer ')) return candidate.slice(7);
  return candidate;
}

function getUserRoom(userId) {
  return `user:${userId}`;
}

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) return next(new Error('No autorizado'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      return next();
    } catch (_error) {
      return next(new Error('Token inválido'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = Number(socket.user?.id);
    if (userId) socket.join(getUserRoom(userId));

    socket.on('messages:join', (conversationId) => {
      const normalizedConversationId = Number(conversationId);
      if (normalizedConversationId) socket.join(`conversation:${normalizedConversationId}`);
    });
  });

  return ioInstance;
}

function emitMessageToUsers({ userIds, payload }) {
  if (!ioInstance) return;

  userIds.forEach((userId) => {
    ioInstance.to(getUserRoom(userId)).emit('message:new', payload);
  });
}

module.exports = {
  initSocket,
  emitMessageToUsers,
};
