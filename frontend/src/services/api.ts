import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor (e.g. for injecting Auth Tokens in the future)
apiClient.interceptors.request.use(
  (config) => {
    const isAdminRequest = config.url?.includes('/admin') || window.location.pathname.startsWith('/admin');
    const token = isAdminRequest 
      ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token'))
      : (localStorage.getItem('auth_token') || localStorage.getItem('admin_token'));
      
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (e.g. for handling errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Logic for token refresh or redirect to login could go here
    }
    return Promise.reject(error);
  }
);
