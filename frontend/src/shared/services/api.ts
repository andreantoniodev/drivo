import axios from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getCookie('drivo_token') || localStorage.getItem('drivo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const url: string = error.config?.url ?? '';
      const isCredentialCheck = url.endsWith('/auth/login') || url.endsWith('/users/me/password');

      if (error.response?.status === 401 && !isCredentialCheck) {
        deleteCookie('drivo_token');
        localStorage.removeItem('drivo_token');
        localStorage.removeItem('drivo_user');

        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  },
);
