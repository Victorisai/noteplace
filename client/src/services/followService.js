import apiRequest from './api';

export function toggleFollow(userId) {
  return apiRequest(`/follows/${userId}/toggle`, { method: 'POST' });
}

export function removeFollower(userId) {
  return apiRequest(`/follows/${userId}/follower`, { method: 'DELETE' });
}

export function getFollowersByUsername(username) {
  return apiRequest(`/follows/user/${username}/followers`);
}

export function getFollowingByUsername(username) {
  return apiRequest(`/follows/user/${username}/following`);
}
