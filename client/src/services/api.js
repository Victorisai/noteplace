const API_URL = 'http://localhost:4000/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('noteplace_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Ocurrió un error');
  }

  return data;
}

export default apiRequest;