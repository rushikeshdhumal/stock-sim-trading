import { Request, Response } from 'express';
import authService from '../services/authService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const result = await authService.register(username, email, password);

    successResponse(res, result, 'User registered successfully', 201);
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    successResponse(res, result, 'Login successful');
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await authService.getUserById(userId);

    successResponse(res, user);
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { username, email } = req.body;

    const user = await authService.updateProfile(userId, { username, email });

    successResponse(res, user, 'Profile updated successfully');
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a stateless JWT system, logout is handled client-side
    // If using refresh tokens stored in DB, invalidate them here
    successResponse(res, null, 'Logout successful');
  });
}

export default new AuthController();
