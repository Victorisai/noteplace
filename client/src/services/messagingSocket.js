import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

let socketInstance = null;

export function connectMessagingSocket(token) {
  if (!token || !SOCKET_URL) return null;

  if (socketInstance?.connected) return socketInstance;

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
  });

  return socketInstance;
}

export function disconnectMessagingSocket() {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
}

export function subscribeToIncomingMessages(handler) {
  if (!socketInstance) return () => {};

  socketInstance.on('message:new', handler);
  return () => socketInstance?.off('message:new', handler);
}
