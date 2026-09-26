import axios from 'axios';
import { normalizeApiError } from './api/errorUtils';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Bimba AI API URL is not configured. Please set the required VITE_API_BASE_URL environment variable.");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Request Interceptor (e.g. for injecting Auth Tokens in the future)
apiClient.interceptors.request.use(
  (config) => {
    // Let browser/axios set Content-Type for FormData (multipart/form-data with boundaries)
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    } else {
      if (config.headers && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const isStaffRequest = config.url?.includes('/admin') || 
                           config.url?.includes('/placement') || 
                           window.location.pathname.startsWith('/admin') || 
                           window.location.pathname.startsWith('/placement');
    const token = isStaffRequest 
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
    const status = error.response?.status;
    const isLoginEndpoint = error.config?.url?.includes('/login');

    if (status === 401 && !isLoginEndpoint) {
      const isStaffRequest = error.config.url?.includes('/admin') || 
                             error.config.url?.includes('/placement') || 
                             window.location.pathname.startsWith('/admin') || 
                             window.location.pathname.startsWith('/placement');
      if (isStaffRequest) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        const isPlacement = error.config.url?.includes('/placement') || window.location.pathname.startsWith('/placement');
        if (isPlacement) {
          if (window.location.pathname !== '/placement/login') {
            window.location.href = '/placement/login';
          }
        } else {
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
      } else {
        import('../store/userStore').then(({ useUserStore }) => {
          useUserStore.getState().clearAuth();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }).catch(() => {
          localStorage.removeItem('auth_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        });
      }
    }

    // Apply unified normalization for all other cases (including login 401s, timeouts, cancellations, etc.)
    const normalized = normalizeApiError(error);
    error.message = normalized.message;
    (error as any).apiError = normalized;
    
    return Promise.reject(error);
  }
);
