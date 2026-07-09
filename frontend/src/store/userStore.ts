import { create } from 'zustand';

interface UserState {
  user: {
    roll_number: string;
    personal_email: string;
    department: string;
    semester: number;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserState['user'], token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  setUser: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
