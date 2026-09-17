import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  finishBootstrap: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isBootstrapping: !!localStorage.getItem('accessToken'),

  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token);
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isBootstrapping: false,
    });
  },

  setUser: (user) => set({ user }),

  finishBootstrap: () => set({ isBootstrapping: false }),

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });
  },
}));
