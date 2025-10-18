import { create } from 'zustand';
import { User } from '../types';
import authService from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!authService.getAccessToken(),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(email, password);
      authService.setTokens(response.accessToken, response.refreshToken);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(username, email, password);
      authService.setTokens(response.accessToken, response.refreshToken);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = authService.getAccessToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ isAuthenticated: false, user: null });
      authService.logout();
    }
  },
}));
