import apiRequest from './api';

export async function getFeedNotes({ cursor = null, limit = 10, q = '' } = {}) {
  const params = new URLSearchParams({ limit: String(limit), q });
  if (cursor) params.set('cursor', String(cursor));
  return apiRequest(`/notes?${params.toString()}`);
}

export async function createNote({ content, images = [] }) {
  const formData = new FormData();
  formData.append('content', content);
  images.forEach((file) => formData.append('images', file));

  return apiRequest('/notes', {
    method: 'POST',
    body: formData,
  });
}

export async function updateNote(noteId, payload) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(noteId) {
  return apiRequest(`/notes/${noteId}`, { method: 'DELETE' });
}

export async function toggleLike(noteId) {
  return apiRequest(`/notes/${noteId}/like`, { method: 'POST' });
}

export async function toggleBookmark(noteId) {
  return apiRequest(`/notes/${noteId}/bookmark`, { method: 'POST' });
}

export async function getComments(noteId) {
  return apiRequest(`/notes/${noteId}/comments`);
}

export async function createComment(noteId, payload) {
  return apiRequest(`/notes/${noteId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getNotesByUsername(username) {
  return apiRequest(`/notes/user/${username}`);
}

export async function getProfileSummary(username) {
  return apiRequest(`/notes/user/${username}/profile`);
}

export async function getRepliesByUsername(username) {
  return apiRequest(`/notes/user/${username}/replies`);
}

export async function getLikedNotesByUsername(username) {
  return apiRequest(`/notes/user/${username}/likes`);
}
