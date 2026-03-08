import apiRequest from './api';

export async function getFeedNotes({ page = 1, limit = 10, q = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    q,
  });

  return apiRequest(`/notes?${params.toString()}`);
}

export async function createNote(payload) {
  return apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNote(noteId, payload) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(noteId) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export async function toggleLike(noteId) {
  return apiRequest(`/notes/${noteId}/like`, {
    method: 'POST',
  });
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