/**
 * Authentication Middleware
 *
 * JWT-based authentication middleware for Express routes.
 *
 * FEATURES:
 * - Token verification (access + refresh tokens)
 * - Token generation with configurable expiry
 * - Optional authentication for public routes
 * - Express Request extension with user payload
 *
 * TOKEN FLOW:
 * 1. Client sends JWT in Authorization header (Bearer token)
 * 2. Middleware extracts and verifies token
 * 3. Decoded payload attached to req.user
 * 4. Route handler accesses authenticated user via req.user
 *
 * SECURITY:
 * - Access tokens: 7-day expiry (configurable)
 * - Refresh tokens: 30-day expiry (configurable)
 * - Separate secrets for access and refresh tokens
 * - Failed attempts logged for security monitoring
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';

// JWT payload structure
export interface JwtPayload {
  userId: string; // User's database ID
  email: string; // User's email
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate Token Middleware
 *
 * Verifies JWT access token from Authorization header.
 * Returns 401 if token missing, 403 if invalid/expired.
 * Attaches decoded payload to req.user on success.
 *
 * USAGE:
 * ```typescript
 * router.get('/protected', authenticateToken, controller);
 * ```
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token attempt:', err.message);
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Optional Authentication Middleware
 *
 * Attempts to authenticate user but doesn't require it.
 * Useful for routes that show different content for logged-in users
 * but are still accessible to anonymous users.
 *
 * BEHAVIOR:
 * - If valid token present: Attaches user to req.user
 * - If no token or invalid token: Proceeds without req.user
 * - Never returns error response
 *
 * USAGE:
 * ```typescript
 * router.get('/public', optionalAuth, controller);
 * ```
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.user = decoded as JwtPayload;
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Generate Access Token
 *
 * Creates a JWT access token with 7-day expiry (configurable).
 *
 * @param {object} payload - User data to encode (userId, email)
 * @returns {string} Signed JWT token
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
};

/**
 * Generate Refresh Token
 *
 * Creates a JWT refresh token with 30-day expiry (configurable).
 * Used to obtain new access tokens without re-authentication.
 *
 * @param {object} payload - User data to encode (userId, email)
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
};

/**
 * Verify Refresh Token
 *
 * Validates a refresh token and returns the decoded payload.
 *
 * @param {string} token - Refresh token to verify
 * @returns {JwtPayload | null} Decoded payload or null if invalid
 */
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};
