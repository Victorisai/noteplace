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

export function sendConversationMessage(conversationId, payload) {
  const isLegacyPayload = typeof payload === 'string';
  const content = isLegacyPayload ? payload : payload?.content;
  const imageFile = isLegacyPayload ? null : payload?.imageFile || null;

  if (imageFile) {
    const formData = new FormData();
    if (content) formData.append('content', content);
    formData.append('image', imageFile);

    return apiRequest(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
    });
  }

  return apiRequest(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function setConversationPinned(conversationId, pinned) {
  return apiRequest(`/messages/conversations/${conversationId}/pin`, {
    method: 'PATCH',
    body: JSON.stringify({ pinned: Boolean(pinned) }),
  });
}

export function deleteConversation(conversationId) {
  return apiRequest(`/messages/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}
