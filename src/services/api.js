import axios from 'axios';

const api = axios.create({
  baseURL: 'http://147.93.107.58:5000/api', // ← yaha apna VPS ka IP daldo
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
