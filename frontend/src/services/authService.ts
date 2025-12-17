/**
 * Authentication Service
 *
 * Service layer for user authentication and profile management.
 *
 * FEATURES:
 * - User registration with automatic portfolio creation
 * - Login/logout functionality
 * - Token management (localStorage)
 * - Profile updates (username, email)
 * - Current user retrieval
 *
 * AUTHENTICATION FLOW:
 * 1. Login/Register → Receive JWT tokens
 * 2. Store tokens in localStorage
 * 3. API client automatically attaches tokens to requests
 * 4. On 401 error → Clear tokens and redirect to login
 *
 * USAGE:
 * ```typescript
 * import authService from './services/authService';
 *
 * const response = await authService.login('user@example.com', 'password');
 * authService.setTokens(response.accessToken, response.refreshToken);
 * ```
 */
import apiClient from './api';
import type { AuthResponse, User } from '../types/index.js';

export const authService = {
  /**
   * Register New User
   *
   * Creates a new user account and automatically creates a default portfolio
   * with $100,000 starting balance.
   *
   * @param {string} username - Unique username (3-20 characters)
   * @param {string} email - Unique email address
   * @param {string} password - Password (min 6 characters)
   * @returns {Promise<AuthResponse>} User data with access and refresh tokens
   * @throws {Error} If email/username already exists or validation fails
   */
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', {
      username,
      email,
      password,
    });
    return response.data.data;
  },

  /**
   * Login User
   *
   * Authenticates user with email and password, returns JWT tokens.
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} User data with access and refresh tokens
   * @throws {Error} If credentials are invalid
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  /**
   * Logout User
   *
   * Invalidates refresh token on backend and clears tokens from localStorage.
   * Should be followed by redirecting user to login page.
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Get Current User
   *
   * Fetches authenticated user's profile data using JWT token.
   * Used for verifying authentication status and loading user data.
   *
   * @returns {Promise<User>} Current user's profile data
   * @throws {Error} If token is invalid or expired (401)
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<{ data: User }>('/auth/me');
    return response.data.data;
  },

  /**
   * Update User Profile
   *
   * Updates user's username and/or email address.
   *
   * @param {object} data - Fields to update
   * @param {string} [data.username] - New username (optional)
   * @param {string} [data.email] - New email address (optional)
   * @returns {Promise<User>} Updated user profile data
   * @throws {Error} If username/email already taken or validation fails
   */
  async updateProfile(data: { username?: string; email?: string }): Promise<User> {
    const response = await apiClient.put<{ data: User }>('/auth/profile', data);
    return response.data.data;
  },

  /**
   * Store JWT Tokens
   *
   * Saves access and refresh tokens to localStorage.
   * Should be called after successful login/registration.
   *
   * @param {string} accessToken - JWT access token (7-day expiry)
   * @param {string} refreshToken - JWT refresh token (30-day expiry)
   */
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  /**
   * Get Access Token
   *
   * Retrieves the stored JWT access token from localStorage.
   *
   * @returns {string | null} Access token or null if not found
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};

export default authService;
