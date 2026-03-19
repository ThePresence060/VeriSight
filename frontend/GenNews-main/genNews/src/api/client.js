import axios from 'axios';

// Basic error normalization as requested in the design.md
function normalizeError(err) {
  return {
    status: err.response?.status ?? null,
    message: err.response?.data?.detail ?? err.message ?? 'Something went wrong',
    retryable: !err.response || err.response.status >= 500,
  };
}

/**
 * BACKEND INTEGRATION:
 * 1. Change the baseURL to your actual Python/FastAPI production URL.
 * 2. Ensure CORS is enabled on the backend for 'http://localhost:5173'.
 */
const client = axios.create({
  baseURL: 'http://localhost:8000', // Update this for production
  timeout: 180000, // 3 minutes — AI analysis pipeline can take 60-120s on first run
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  res => res,
  err => Promise.reject(normalizeError(err))
);

export default client;
