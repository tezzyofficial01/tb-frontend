// client/src/services/api.js
import axios from 'axios';

// Local dev vs production base URL
const isLocal =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';

const BASE_URL =
  // optional manual override via env (CRA)
  process.env.REACT_APP_API_URL ||
  // localhost par direct backend hit
  (isLocal ? 'http://localhost:5000/api' : '/api'); // prod: Vercel rewrites -> VPS

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // cookies/credentials ke liye
  timeout: 20000,
});

// Attach JWT from localStorage automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: central error logging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;
