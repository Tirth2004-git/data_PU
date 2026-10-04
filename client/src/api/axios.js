import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token and site access token
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem(config.storageKeys.authToken);
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }

    const siteToken = localStorage.getItem(config.storageKeys.siteAccess);
    if (siteToken) {
      reqConfig.headers['x-site-access-token'] = siteToken;
    }

    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const code = error.response.data?.code;
      if (code === 'SITE_ACCESS_REQUIRED' || code === 'SITE_ACCESS_EXPIRED' || code === 'INVALID_SITE_ACCESS_TOKEN') {
        localStorage.removeItem(config.storageKeys.siteAccess);
        // Force refresh to bring up PIN Gate
        window.location.reload();
        return Promise.reject(error);
      }

      localStorage.removeItem(config.storageKeys.authToken);
      localStorage.removeItem(config.storageKeys.adminUser);
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
