import { Request, Response } from 'express';
import achievementService from '../services/achievementService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';

export class AchievementController {
  /**
   * Get all available achievements
   * GET /api/achievements
   */
  getAllAchievements = asyncHandler(async (_req: Request, res: Response) => {
    const achievements = await achievementService.getAllAchievements();
    successResponse(res, achievements);
  });

  /**
   * Get user's earned achievements
   * GET /api/achievements/user/:userId
   */
  getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const achievements = await achievementService.getUserAchievements(userId);
    successResponse(res, achievements);
  });

  /**
   * Get current user's achievements
   * GET /api/achievements/me
   */
  getMyAchievements = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const achievements = await achievementService.getUserAchievements(userId);
    successResponse(res, achievements);
  });

  /**
   * Get achievement progress for current user
   * GET /api/achievements/progress
   */
  getMyProgress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const progress = await achievementService.getAchievementProgress(userId);
    successResponse(res, progress);
  });

  /**
   * Manually check and award achievements for current user
   * POST /api/achievements/check
   */
  checkAchievements = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const newAchievements = await achievementService.checkAndAwardAchievements(userId);

    successResponse(res, {
      newAchievements,
      count: newAchievements.length,
      message:
        newAchievements.length > 0
          ? `Congratulations! You earned ${newAchievements.length} new achievement(s)!`
          : 'No new achievements earned',
    });
  });

  /**
   * Create a new achievement (admin only)
   * POST /api/achievements
   */
  createAchievement = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, criteriaType, criteriaValue, badgeIcon } = req.body;

    const achievement = await achievementService.createAchievement(
      name,
      description,
      criteriaType,
      criteriaValue,
      badgeIcon
    );

    successResponse(res, achievement, 'Achievement created successfully', 201);
  });
}

export default new AchievementController();
