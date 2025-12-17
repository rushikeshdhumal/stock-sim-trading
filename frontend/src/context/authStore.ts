/**
 * Authentication Store (Zustand)
 *
 * Global state management for user authentication using Zustand.
 *
 * STATE:
 * - user: Current authenticated user object (null if not logged in)
 * - isAuthenticated: Boolean flag for authentication status
 * - isLoading: Loading state for async auth operations
 *
 * ACTIONS:
 * - login: Authenticate user with email/password
 * - register: Create new user account
 * - logout: Clear authentication state
 * - checkAuth: Verify current authentication status
 *
 * USAGE:
 * ```typescript
 * import { useAuthStore } from './context/authStore';
 *
 * const { user, isAuthenticated, login, logout } = useAuthStore();
 * await login('user@example.com', 'password');
 * ```
 */

import { create } from 'zustand';
import type { User } from '../types/index.js';
import authService from '../services/authService';

/**
 * Auth State Interface
 *
 * Defines the shape of the authentication state and available actions.
 */
interface AuthState {
  // State
  user: User | null;                  // Current user data
  isAuthenticated: boolean;           // Authentication status
  isLoading: boolean;                 // Loading state for auth operations

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/**
 * Auth Store Hook
 *
 * Zustand store for managing authentication state across the application.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: !!authService.getAccessToken(), // Check if token exists in localStorage
  isLoading: false,

  /**
   * Login User
   *
   * Authenticates user with email and password, stores tokens, and updates state.
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @throws {Error} If login fails (invalid credentials, network error, etc.)
   */
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

  /**
   * Register New User
   *
   * Creates a new user account, automatically logs them in, and updates state.
   * New users receive $100,000 starting balance in their default portfolio.
   *
   * @param {string} username - Unique username (3-20 characters)
   * @param {string} email - Unique email address
   * @param {string} password - Password (min 6 characters)
   * @throws {Error} If registration fails (email taken, validation error, etc.)
   */
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(username, email, password);
      // Store tokens in localStorage
      authService.setTokens(response.accessToken, response.refreshToken);
      // Update auth state
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Logout User
   *
   * Clears authentication tokens and resets auth state.
   * Redirects user to login page.
   */
  logout: async () => {
    try {
      await authService.logout(); // Call backend logout endpoint
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth state, even if backend call fails
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Check Authentication Status
   *
   * Verifies if the current JWT token is valid by fetching user data.
   * Called on app initialization and protected route access.
   * Clears auth state if token is invalid or expired.
   */
  checkAuth: async () => {
    const token = authService.getAccessToken();
    if (!token) {
      // No token found - user not authenticated
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      // Verify token by fetching user data
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch (error) {
      // Token invalid or expired - clear auth state
      set({ isAuthenticated: false, user: null });
      authService.logout();
    }
  },
}));
