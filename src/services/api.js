// client/src/services/api.js
import axios from 'axios';

// Decide baseURL based on where the app is running
const BASE_URL =
  process.env.REACT_APP_API_URL // (optional) override via .env
  || (window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'                    // dev/local
      : 'https://tb-backend-tnab.onrender.com/api');   // prod/live

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // if your server reads cookies; safe to keep
  timeout: 20000,
});

// Attach JWT automatically (from localStorage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
