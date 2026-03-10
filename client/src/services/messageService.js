import apiRequest from './api';

export function getMessageConversations() {
  return apiRequest('/messages/conversations');
}

export function searchFollowingForMessages(query) {
  const params = new URLSearchParams({ q: query || '' });
  return apiRequest(`/messages/following?${params.toString()}`);
}

export function openConversationWithUser(userId) {
  return apiRequest(`/messages/conversations/with/${userId}`, {
    method: 'POST',
  });
}

export function getConversationMessages(conversationId, { before = null, limit = 40 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', String(before));
  return apiRequest(`/messages/conversations/${conversationId}/messages?${params.toString()}`);
}

export function sendConversationMessage(conversationId, content) {
  return apiRequest(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
