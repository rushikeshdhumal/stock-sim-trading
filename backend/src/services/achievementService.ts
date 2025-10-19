import { Achievement } from '@prisma/client';
import getPrismaClient from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const prisma = getPrismaClient();

export class AchievementService {
  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return await prisma.achievement.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get user's earned achievements
   */
  async getUserAchievements(userId: string) {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    return userAchievements.map((ua) => ({
      id: ua.id,
      achievementId: ua.achievementId,
      name: ua.achievement.name,
      description: ua.achievement.description,
      badgeIcon: ua.achievement.badgeIcon,
      earnedAt: ua.earnedAt,
    }));
  }

  /**
   * Check and award achievements for a user
   * This should be called after significant events (trades, etc.)
   */
  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    logger.info(`Checking achievements for user ${userId}`);

    const newlyEarned: Achievement[] = [];

    try {
      // Get all achievements
      const allAchievements = await prisma.achievement.findMany();

      // Get user's existing achievements
      const existingAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });

      const existingIds = new Set(existingAchievements.map((a) => a.achievementId));

      // Get user's trading data
      const portfolios = await prisma.portfolio.findMany({
        where: { userId },
        include: {
          trades: {
            orderBy: { executedAt: 'asc' },
          },
          holdings: true,
        },
      });

      // Check each achievement
      for (const achievement of allAchievements) {
        // Skip if already earned
        if (existingIds.has(achievement.id)) {
          continue;
        }

        const earned = await this.checkAchievementCriteria(
          achievement,
          userId,
          portfolios
        );

        if (earned) {
          // Award achievement
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
            },
          });

          newlyEarned.push(achievement);
          logger.info(`Achievement awarded: ${achievement.name} to user ${userId}`);
        }
      }

      return newlyEarned;
    } catch (error) {
      logger.error('Achievement check failed:', error);
      throw new AppError('Failed to check achievements', 500);
    }
  }

  /**
   * Check if achievement criteria is met
   */
  private async checkAchievementCriteria(
    achievement: Achievement,
    userId: string,
    portfolios: any[]
  ): Promise<boolean> {
    const { criteriaType, criteriaValue } = achievement;
    const criteria = criteriaValue as any;

    switch (criteriaType) {
      case 'trade_count': {
        // First Trade achievement
        const totalTrades = portfolios.reduce(
          (sum, p) => sum + p.trades.length,
          0
        );
        return totalTrades >= (criteria.min || 1);
      }

      case 'unique_holdings': {
        // Diversified achievement
        const uniqueSymbols = new Set<string>();
        portfolios.forEach((p) => {
          p.holdings.forEach((h: any) => uniqueSymbols.add(h.symbol));
        });
        return uniqueSymbols.size >= (criteria.min || 10);
      }

      case 'daily_trades': {
        // Day Trader achievement
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayTrades = portfolios.reduce((sum, p) => {
          const tradesCount = p.trades.filter(
            (t: any) => t.executedAt >= today && t.executedAt < tomorrow
          ).length;
          return sum + tradesCount;
        }, 0);

        return todayTrades >= (criteria.min || 10);
      }

      case 'hold_duration': {
        // Diamond Hands achievement
        const now = new Date();
        for (const portfolio of portfolios) {
          for (const holding of portfolio.holdings) {
            // Find first buy trade for this holding
            const firstBuy = portfolio.trades.find(
              (t: any) =>
                t.symbol === holding.symbol &&
                t.tradeType === 'BUY'
            );

            if (firstBuy) {
              const holdDays =
                (now.getTime() - firstBuy.executedAt.getTime()) /
                (1000 * 60 * 60 * 24);
              if (holdDays >= (criteria.min_days || 30)) {
                return true;
              }
            }
          }
        }
        return false;
      }

      case 'weekly_return': {
        // Week Warrior achievement
        // Check if any portfolio has positive return this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        for (const portfolio of portfolios) {
          if (portfolio.createdAt < weekAgo) {
            const initialValue = 100000; // Starting balance
            const currentValue = portfolio.totalValue?.toNumber() || portfolio.cashBalance.toNumber();
            const returnPercentage = ((currentValue - initialValue) / initialValue) * 100;

            if (returnPercentage > (criteria.min || 0)) {
              return true;
            }
          }
        }
        return false;
      }

      case 'leaderboard_rank': {
        // Top 10% achievement
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const leaderboardEntry = await prisma.leaderboard.findFirst({
          where: {
            userId,
            snapshotDate: today,
          },
        });

        if (leaderboardEntry) {
          const totalCount = await prisma.leaderboard.count({
            where: {
              period: leaderboardEntry.period,
              snapshotDate: today,
            },
          });

          const percentile = (leaderboardEntry.rank / totalCount) * 100;
          return percentile <= (criteria.percentile || 10);
        }

        return false;
      }

      case 'beat_sp500': {
        // Beat the Market achievement
        // Simplified: check if monthly return > 2% (approximate S&P 500 monthly avg)
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        for (const portfolio of portfolios) {
          if (portfolio.createdAt < monthAgo) {
            const initialValue = 100000;
            const currentValue = portfolio.totalValue?.toNumber() || portfolio.cashBalance.toNumber();
            const returnPercentage = ((currentValue - initialValue) / initialValue) * 100;

            if (returnPercentage > 2) {
              // Simplified benchmark
              return true;
            }
          }
        }
        return false;
      }

      default:
        logger.warn(`Unknown achievement criteria type: ${criteriaType}`);
        return false;
    }
  }

  /**
   * Get achievement progress for user
   */
  async getAchievementProgress(userId: string) {
    const allAchievements = await this.getAllAchievements();
    const earnedAchievements = await this.getUserAchievements(userId);
    const earnedIds = new Set(earnedAchievements.map((a) => a.achievementId));

    return {
      total: allAchievements.length,
      earned: earnedAchievements.length,
      progress: (earnedAchievements.length / allAchievements.length) * 100,
      achievements: allAchievements.map((achievement) => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earnedAt: earnedAchievements.find((e) => e.achievementId === achievement.id)?.earnedAt,
      })),
    };
  }

  /**
   * Create a new achievement (admin only)
   */
  async createAchievement(
    name: string,
    description: string,
    criteriaType: string,
    criteriaValue: any,
    badgeIcon?: string
  ): Promise<Achievement> {
    return await prisma.achievement.create({
      data: {
        name,
        description,
        criteriaType,
        criteriaValue,
        badgeIcon,
      },
    });
  }
}

export default new AchievementService();
