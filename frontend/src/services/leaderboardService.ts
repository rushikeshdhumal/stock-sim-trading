import apiClient from './api';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  portfolioName: string;
  returnPercentage: number;
  totalValue: number;
  period: string;
  snapshotDate: string;
}

export interface UserRank {
  period: string;
  rank: number;
  returnPercentage: number;
}

export interface UserPosition {
  rank: number;
  returnPercentage: number;
  totalParticipants: number;
  percentile: number;
  ranked: boolean;
}

export const leaderboardService = {
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

  async getMyRanks(): Promise<UserRank[]> {
    const response = await apiClient.get<{ data: UserRank[] }>('/leaderboards/me/ranks');
    return response.data.data;
  },

  async getUserPosition(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): Promise<UserPosition> {
    const response = await apiClient.get<{ data: UserPosition }>(
      `/leaderboards/position/${period}`
    );
    return response.data.data;
  },

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
