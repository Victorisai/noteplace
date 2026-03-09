import apiRequest from './api';

export async function registerUser(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return apiRequest('/auth/me');
}

export async function updateMyProfile(payload) {
  return apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  return apiRequest('/auth/me/avatar', {
    method: 'POST',
    body: formData,
  });
}
