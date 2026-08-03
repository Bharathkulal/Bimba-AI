import axios from 'axios';

export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If env URL is set and is a production host, use it directly
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // Otherwise, if accessing via local network IP (e.g. from phone), map to host IP at backend port 8000
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  return envUrl || 'http://localhost:8000';
})();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request Interceptor (e.g. for injecting Auth Tokens in the future)
apiClient.interceptors.request.use(
  (config) => {
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
    // Handle specific errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Do not redirect on login endpoints so the form can handle the 401 error
      if (error.config && error.config.url && error.config.url.includes('/login')) {
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
    }
    return Promise.reject(error);
  }
);
