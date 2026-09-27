import axios from 'axios';

// Gunakan URL VPS saat di dev lokal (5173), atau relative path '/api' saat di server port 80
const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173';

const DEFAULT_API_URL = isLocalDev ? 'http://43.157.203.140:3000/api' : '/api';

export const API_URL = localStorage.getItem('examora_api_url') || DEFAULT_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('examora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('examora_token');
      localStorage.removeItem('examora_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register-school')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
