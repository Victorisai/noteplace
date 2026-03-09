import apiRequest from './api';

export function toggleFollow(userId) {
  return apiRequest(`/follows/${userId}/toggle`, { method: 'POST' });
}
