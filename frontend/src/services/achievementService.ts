/**
 * Achievement Service
 *
 * Service layer for managing user achievements and gamification.
 *
 * FEATURES:
 * - Fetch all available achievements
 * - Get user's earned achievements
 * - Track achievement progress (percentage completed)
 * - Trigger achievement checks after trades
 *
 * ACHIEVEMENT TYPES:
 * - Trade milestones (first trade, 10 trades, 100 trades, etc.)
 * - Portfolio value milestones (reach $150k, $200k, etc.)
 * - Return percentage achievements (10% gain, 50% gain, etc.)
 * - Diversity achievements (own 5 stocks, 10 stocks, etc.)
 * - Streak achievements (trade 5 days in a row, etc.)
 *
 * AUTOMATIC TRIGGERS:
 * - Achievement checks run automatically after each trade
 * - New achievements are awarded in real-time
 * - Progress updates for partially completed achievements
 *
 * USAGE:
 * ```typescript
 * import achievementService from './services/achievementService';
 *
 * const progress = await achievementService.getProgress();
 * const newAchievements = await achievementService.checkAchievements();
 * ```
 */
import apiClient from './api';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  badgeIcon?: string;
  criteriaType: string;
  criteriaValue: any;
  createdAt: string;
};

export type UserAchievement = {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  badgeIcon?: string;
  earnedAt: string;
};

export type AchievementProgress = {
  total: number;
  earned: number;
  progress: number;
  achievements: Array<Achievement & { earned: boolean; earnedAt?: string }>;
};

export const achievementService = {
  /**
   * Get All Available Achievements
   *
   * Fetches the complete list of all achievements that can be earned.
   * Used for displaying achievement catalog and requirements.
   *
   * @returns {Promise<Achievement[]>} Array of all achievements in the system
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const response = await apiClient.get<{ data: Achievement[] }>('/achievements');
    return response.data.data;
  },

  /**
   * Get User's Earned Achievements
   *
   * Fetches achievements that the current user has already earned.
   * Includes earned timestamp for each achievement.
   *
   * @returns {Promise<UserAchievement[]>} Array of user's earned achievements
   */
  async getMyAchievements(): Promise<UserAchievement[]> {
    const response = await apiClient.get<{ data: UserAchievement[] }>('/achievements/me');
    return response.data.data;
  },

  /**
   * Get Achievement Progress
   *
   * Fetches comprehensive achievement progress for the current user.
   * Returns total achievements, earned count, progress percentage, and
   * detailed status for each achievement (earned/not earned).
   *
   * @returns {Promise<AchievementProgress>} Progress summary with achievement details
   */
  async getProgress(): Promise<AchievementProgress> {
    const response = await apiClient.get<{ data: AchievementProgress }>('/achievements/progress');
    return response.data.data;
  },

  /**
   * Check for New Achievements
   *
   * Manually triggers achievement evaluation for the current user.
   * Checks all achievement criteria against user's current stats and awards
   * any newly earned achievements.
   *
   * NOTE: This is called automatically after trades, but can also be called
   * manually to check for achievements that may have been missed.
   *
   * @returns {Promise<object>} Newly awarded achievements and count
   */
  async checkAchievements(): Promise<{
    newAchievements: Achievement[];
    count: number;
    message: string;
  }> {
    const response = await apiClient.post<{
      data: { newAchievements: Achievement[]; count: number; message: string };
    }>('/achievements/check');
    return response.data.data;
  },
};

export default achievementService;
