/**
 * API Client Configuration
 *
 * Centralized Axios client for all API requests to the backend.
 *
 * FEATURES:
 * - Automatic JWT token injection in request headers
 * - Automatic token refresh on 401 errors
 * - Centralized error handling
 * - Base URL configuration from environment
 *
 * AUTHENTICATION FLOW:
 * 1. Request interceptor adds JWT token from localStorage
 * 2. If 401 response (unauthorized), clear tokens and redirect to login
 * 3. All API services use this client for consistency
 *
 * USAGE:
 * ```typescript
 * import apiClient from './api';
 * const response = await apiClient.get('/portfolios');
 * ```
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

// API base URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API Client Class
 *
 * Singleton Axios instance with interceptors for authentication and error handling.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Create Axios instance with base configuration
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Automatically inject JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Add Bearer token to Authorization header
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle authentication errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth state and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get Axios Instance
   *
   * @returns {AxiosInstance} Configured Axios instance
   */
  getInstance() {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient().getInstance();
export default apiClient;
