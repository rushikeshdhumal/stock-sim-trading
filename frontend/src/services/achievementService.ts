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
  async getAllAchievements(): Promise<Achievement[]> {
    const response = await apiClient.get<{ data: Achievement[] }>('/achievements');
    return response.data.data;
  },

  async getMyAchievements(): Promise<UserAchievement[]> {
    const response = await apiClient.get<{ data: UserAchievement[] }>('/achievements/me');
    return response.data.data;
  },

  async getProgress(): Promise<AchievementProgress> {
    const response = await apiClient.get<{ data: AchievementProgress }>('/achievements/progress');
    return response.data.data;
  },

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
