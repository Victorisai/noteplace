import apiRequest from './api';

export async function getFeedNotes() {
  return apiRequest('/notes');
}

export async function createNote(payload) {
  return apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(noteId) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export async function getNotesByUsername(username) {
  return apiRequest(`/notes/user/${username}`);
}