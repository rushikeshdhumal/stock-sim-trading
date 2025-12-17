/**
 * Leaderboard Service
 *
 * Service layer for fetching leaderboard rankings and user positions.
 *
 * FEATURES:
 * - Global leaderboards (daily, weekly, monthly, all-time)
 * - User rank tracking across all time periods
 * - Top performers leaderboard (top 10)
 * - User position with percentile ranking
 *
 * RANKING CRITERIA:
 * - Based on portfolio return percentage (not absolute value)
 * - Updated periodically via backend cron jobs
 * - Separate rankings for each time period
 * - Fair comparison regardless of starting balance
 *
 * TIME PERIODS:
 * - Daily: Rankings for past 24 hours
 * - Weekly: Rankings for past 7 days
 * - Monthly: Rankings for past 30 days
 * - All-time: Rankings since account creation
 *
 * USAGE:
 * ```typescript
 * import leaderboardService from './services/leaderboardService';
 *
 * const topDaily = await leaderboardService.getLeaderboard('daily', 100);
 * const myRanks = await leaderboardService.getMyRanks();
 * ```
 */
import apiClient from './api';

export type LeaderboardEntry = {
  id: string;
  rank: number;
  username: string;
  portfolioName: string;
  returnPercentage: number;
  totalValue: number;
  period: string;
  snapshotDate: string;
};

export type UserRank = {
  period: string;
  rank: number;
  returnPercentage: number;
};

export type UserPosition = {
  rank: number;
  returnPercentage: number;
  totalParticipants: number;
  percentile: number;
  ranked: boolean;
};

export const leaderboardService = {
  /**
   * Get Leaderboard
   *
   * Fetches paginated leaderboard rankings for a specific time period.
   * Rankings are based on portfolio return percentage.
   *
   * @param {'daily' | 'weekly' | 'monthly' | 'all_time'} period - Time period for rankings
   * @param {number} [limit=100] - Maximum number of entries to return
   * @param {number} [offset=0] - Number of entries to skip (for pagination)
   * @returns {Promise<LeaderboardEntry[]>} Array of leaderboard entries with rank, username, and performance
   */
  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'all_time',
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<{ data: LeaderboardEntry[] }>(
      `/leaderboards/${period}`,
      {
        params: { limit, offset },
      }
    );
    return response.data.data;
  },

  /**
   * Get My Ranks
   *
   * Fetches the current user's rank across all time periods.
   * Returns rank and return percentage for daily, weekly, monthly, and all-time.
   *
   * @returns {Promise<UserRank[]>} Array of user's rankings for each period
   */
  async getMyRanks(): Promise<UserRank[]> {
    const response = await apiClient.get<{ data: UserRank[] }>('/leaderboards/me/ranks');
    return response.data.data;
  },

  /**
   * Get User Position
   *
   * Fetches detailed position information for a specific time period.
   * Includes rank, percentile (top X%), total participants, and ranking status.
   *
   * @param {'daily' | 'weekly' | 'monthly' | 'all_time'} period - Time period to check
   * @returns {Promise<UserPosition>} Detailed position data with percentile ranking
   */
  async getUserPosition(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): Promise<UserPosition> {
    const response = await apiClient.get<{ data: UserPosition }>(
      `/leaderboards/position/${period}`
    );
    return response.data.data;
  },

  /**
   * Get Top Performers
   *
   * Fetches the top N performers for a specific time period.
   * Commonly used for displaying "Top 10" leaderboards.
   *
   * @param {'daily' | 'weekly' | 'monthly' | 'all_time'} period - Time period for rankings
   * @param {number} [limit=10] - Number of top performers to return (default: 10)
   * @returns {Promise<LeaderboardEntry[]>} Array of top performer entries
   */
  async getTopPerformers(
    period: 'daily' | 'weekly' | 'monthly' | 'all_time',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<{ data: LeaderboardEntry[] }>(
      `/leaderboards/top/${period}`,
      {
        params: { limit },
      }
    );
    return response.data.data;
  },
};

export default leaderboardService;
