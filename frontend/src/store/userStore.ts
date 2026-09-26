import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface User {
  roll_number: string;
  personal_email: string;
  department: string;
  semester: number;
  student_name?: string;
  full_name?: string;
  dob?: string;
  phone?: string;
  gender?: string;
  address?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  portfolio_website?: string;
  skills?: string;
  languages?: string;
  career_objective?: string;
  profile_photo?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: any) => Promise<void>;
  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useUserStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isInitializing: true,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      const { access_token, student } = response.data;
      
      localStorage.setItem('auth_token', access_token);
      set({ 
        user: student, 
        token: access_token, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.detail || err.message || 'Incorrect Roll Number or Password.',
        isAuthenticated: false,
        user: null,
        token: null
      });
      throw err;
    }
  },

  setUser: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true, error: null });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  logout: async () => {
    if (get().isLoading) return;
    try {
      set({ isLoading: true });
      await apiClient.post('/api/auth/logout');
    } catch (err: any) {
      console.error('Logout API failed, continuing with local cleanup:', err);
    } finally {
      get().clearAuth();
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isInitializing: false, isAuthenticated: false, user: null });
      return;
    }
    
    // We have a token, but let's check if we already have the user
    if (get().user) {
      set({ isInitializing: false, isAuthenticated: true });
      return;
    }
    
    try {
      const res = await apiClient.get('/api/auth/me');
      set({ user: res.data, token, isAuthenticated: true, isInitializing: false, error: null });
    } catch (err) {
      get().clearAuth();
      set({ isInitializing: false });
    }
  }
}));

