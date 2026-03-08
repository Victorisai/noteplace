import apiRequest from './api';

export async function searchAll(q) {
  const params = new URLSearchParams({ q });
  return apiRequest(`/search?${params.toString()}`);
}