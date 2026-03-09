const API_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = (() => {
  if (!API_URL) return '';
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();

export function toAbsoluteAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (API_ORIGIN) return `${API_ORIGIN}${normalizedPath}`;
  if (API_URL) return `${API_URL}${normalizedPath}`;
  return normalizedPath;
}

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('noteplace_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Ocurrió un error');
  }

  return data;
}

export default apiRequest;
