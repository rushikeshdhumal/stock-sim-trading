/**
 * Authentication Service
 *
 * Handles user authentication, registration, and profile management.
 *
 * KEY FEATURES:
 * - User registration with automatic portfolio creation
 * - Secure password hashing using bcrypt (12 rounds)
 * - JWT-based authentication (access + refresh tokens)
 * - Email and username uniqueness validation
 * - Starting balance: $100,000 virtual cash per user
 *
 * SECURITY:
 * - Passwords hashed with bcrypt (12 salt rounds)
 * - Access tokens: 7-day expiry (configurable)
 * - Refresh tokens: 30-day expiry (configurable)
 * - Tokens signed with separate secrets
 *
 * USER REGISTRATION FLOW:
 * 1. Validate email/username uniqueness
 * 2. Hash password with bcrypt
 * 3. Create user record
 * 4. Create default portfolio with $100,000 cash
 * 5. Generate JWT tokens
 * 6. Return user data with tokens
 */

import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import getPrismaClient from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { AuthResponse, UserResponse } from '../types';
import logger from '../config/logger';

const prisma = getPrismaClient();

export class AuthService {
  /**
   * Register New User
   *
   * Creates a new user account with hashed password and default portfolio.
   * Automatically assigns $100,000 starting balance.
   *
   * @param {string} username - Unique username (3-20 characters)
   * @param {string} email - Unique email address
   * @param {string} password - Plain text password (will be hashed)
   * @returns {Promise<AuthResponse>} User data with JWT tokens
   * @throws {AppError} 409 if email or username already exists
   */
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new AppError('Email already registered', 409);
        }
        if (existingUser.username === username) {
          throw new AppError('Username already taken', 409);
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          startingBalance: 100000,
        },
      });

      // Create default portfolio
      await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: 'Main Portfolio',
          cashBalance: user.startingBalance,
          totalValue: user.startingBalance,
          isActive: true,
        },
      });

      logger.info(`New user registered: ${user.email}`);

      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Registration error:', error);
      throw new AppError('Failed to register user', 500);
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      logger.info(`User logged in: ${user.email}`);

      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Login error:', error);
      throw new AppError('Failed to login', 500);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { username?: string; email?: string }
  ): Promise<UserResponse> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });

      logger.info(`User profile updated: ${user.email}`);

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Update profile error:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  /**
   * Generate auth response with tokens
   */
  private generateAuthResponse(user: User): AuthResponse {
    const userResponse = this.sanitizeUser(user);
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      startingBalance: user.startingBalance.toNumber(),
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
