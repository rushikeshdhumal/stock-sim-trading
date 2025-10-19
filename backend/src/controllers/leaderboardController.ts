import { Request, Response } from 'express';
import { LeaderboardPeriod } from '@prisma/client';
import leaderboardService from '../services/leaderboardService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

export class LeaderboardController {
  /**
   * Get leaderboard for a specific period
   * GET /api/leaderboards/:period
   */
  getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.params;
    const { limit = '100', offset = '0' } = req.query;

    // Validate period
    const validPeriods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const periodUpper = period.toUpperCase() as LeaderboardPeriod;

    if (!validPeriods.includes(periodUpper)) {
      throw new AppError('Invalid period. Must be: daily, weekly, monthly, or all_time', 400);
    }

    const leaderboard = await leaderboardService.getLeaderboard(
      periodUpper,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    successResponse(res, leaderboard);
  });

  /**
   * Get user's ranks across all periods
   * GET /api/leaderboards/user/:userId
   */
  getUserRanks = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const ranks = await leaderboardService.getUserRanks(userId);

    successResponse(res, ranks);
  });

  /**
   * Get user's current ranks
   * GET /api/leaderboards/me
   */
  getMyRanks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const ranks = await leaderboardService.getUserRanks(userId);

    successResponse(res, ranks);
  });

  /**
   * Get top performers for a period
   * GET /api/leaderboards/top/:period
   */
  getTopPerformers = asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.params;
    const { limit = '10' } = req.query;

    const validPeriods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const periodUpper = period.toUpperCase() as LeaderboardPeriod;

    if (!validPeriods.includes(periodUpper)) {
      throw new AppError('Invalid period', 400);
    }

    const topPerformers = await leaderboardService.getTopPerformers(
      periodUpper,
      parseInt(limit as string)
    );

    successResponse(res, topPerformers);
  });

  /**
   * Trigger leaderboard calculation (admin/cron only)
   * POST /api/leaderboards/calculate
   */
  calculateLeaderboards = asyncHandler(async (_req: Request, res: Response) => {
    await leaderboardService.calculateLeaderboards();

    successResponse(res, { message: 'Leaderboards calculated successfully' });
  });

  /**
   * Get user's position on specific leaderboard
   * GET /api/leaderboards/position/:period
   */
  getUserPosition = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { period } = req.params;

    const validPeriods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
    const periodUpper = period.toUpperCase() as LeaderboardPeriod;

    if (!validPeriods.includes(periodUpper)) {
      throw new AppError('Invalid period', 400);
    }

    const position = await leaderboardService.getUserPosition(userId, periodUpper);

    if (!position) {
      successResponse(res, {
        message: 'No ranking found for this period',
        ranked: false,
      });
      return;
    }

    successResponse(res, { ...position, ranked: true });
  });
}

export default new LeaderboardController();
