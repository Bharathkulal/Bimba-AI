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
    if (!error.response) {
      error.message = "Unable to connect to Bimba AI server. Please check whether the backend is running.";
    } else {
      const status = error.response.status;
      if (status === 401) {
        // Do not redirect on login endpoints so the form can handle the 401 error
        if (error.config && error.config.url && error.config.url.includes('/login')) {
          error.message = "Unauthorized";
          return Promise.reject(error);
        }
        
        const isStaffRequest = error.config.url?.includes('/admin') || 
                               error.config.url?.includes('/placement') || 
                               window.location.pathname.startsWith('/admin') || 
                               window.location.pathname.startsWith('/placement');
        if (isStaffRequest) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_role');
          const isPlacement = error.config.url?.includes('/placement') || window.location.pathname.startsWith('/placement');
          if (isPlacement) {
            window.location.href = '/placement/login';
          } else {
            window.location.href = '/admin/login';
          }
        } else {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      } else if (status === 400) {
        error.message = "Bad Request";
      } else if (status === 403) {
        error.message = "Forbidden";
      } else if (status === 404) {
        error.message = "Not Found";
      } else if (status === 422) {
        error.message = "Validation Error";
      } else if (status === 429) {
        error.message = "Too Many Requests";
      } else if (status >= 500) {
        error.message = "Server Error";
      }
    }
    return Promise.reject(error);
  }
);
