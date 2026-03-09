import apiRequest from './api';

export function getMyNotifications() {
  return apiRequest('/notifications');
}

export function markNotificationsRead() {
  return apiRequest('/notifications/mark-read', { method: 'POST' });
}
