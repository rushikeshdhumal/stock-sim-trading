import { LeaderboardPeriod } from '@prisma/client';
import getPrismaClient from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const prisma = getPrismaClient();

export class LeaderboardService {
  /**
   * Get leaderboard for a specific period
   */
  async getLeaderboard(
    period: LeaderboardPeriod,
    limit: number = 100,
    offset: number = 0
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaderboard = await prisma.leaderboard.findMany({
      where: {
        period,
        snapshotDate: today,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
        portfolio: {
          select: {
            name: true,
            totalValue: true,
            cashBalance: true,
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return leaderboard.map((entry) => ({
      id: entry.id,
      rank: entry.rank,
      username: entry.user.username,
      portfolioName: entry.portfolio.name,
      returnPercentage: entry.returnPercentage.toNumber(),
      totalValue: entry.portfolio.totalValue?.toNumber() || 0,
      period: entry.period,
      snapshotDate: entry.snapshotDate,
    }));
  }

  /**
   * Get user's rank across all periods
   */
  async getUserRanks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ranks = await prisma.leaderboard.findMany({
      where: {
        userId,
        snapshotDate: today,
      },
      orderBy: {
        period: 'asc',
      },
    });

    return ranks.map((rank) => ({
      period: rank.period,
      rank: rank.rank,
      returnPercentage: rank.returnPercentage.toNumber(),
    }));
  }

  /**
   * Calculate and update leaderboards for all periods
   * This should be run as a background job
   */
  async calculateLeaderboards() {
    logger.info('Starting leaderboard calculation...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get all active portfolios with their performance
      const portfolios = await prisma.portfolio.findMany({
        where: {
          isActive: true,
        },
        include: {
          user: true,
          trades: {
            orderBy: {
              executedAt: 'asc',
            },
          },
        },
      });

      // Calculate returns for each portfolio
      const portfolioReturns = await Promise.all(
        portfolios.map(async (portfolio) => {
          const initialValue = portfolio.user.startingBalance.toNumber();
          const currentValue = portfolio.totalValue?.toNumber() || portfolio.cashBalance.toNumber();
          const returnPercentage = ((currentValue - initialValue) / initialValue) * 100;

          return {
            userId: portfolio.userId,
            portfolioId: portfolio.id,
            returnPercentage,
            currentValue,
          };
        })
      );

      // Sort by return percentage
      const sortedReturns = [...portfolioReturns].sort(
        (a, b) => b.returnPercentage - a.returnPercentage
      );

      // Create leaderboard entries for ALL_TIME
      await this.createLeaderboardEntries(sortedReturns, 'ALL_TIME', today);

      // Calculate daily returns (portfolios created/updated today)
      const dailyReturns = portfolioReturns.filter((p) => {
        const portfolio = portfolios.find((pf) => pf.id === p.portfolioId);
        if (!portfolio) return false;

        const createdToday = portfolio.createdAt >= today;
        const hasTradesToday = portfolio.trades.some(
          (trade) => trade.executedAt >= today
        );

        return createdToday || hasTradesToday;
      });

      if (dailyReturns.length > 0) {
        const sortedDaily = [...dailyReturns].sort(
          (a, b) => b.returnPercentage - a.returnPercentage
        );
        await this.createLeaderboardEntries(sortedDaily, 'DAILY', today);
      }

      // Calculate weekly returns (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyReturns = portfolioReturns.filter((p) => {
        const portfolio = portfolios.find((pf) => pf.id === p.portfolioId);
        return portfolio && portfolio.createdAt >= weekAgo;
      });

      if (weeklyReturns.length > 0) {
        const sortedWeekly = [...weeklyReturns].sort(
          (a, b) => b.returnPercentage - a.returnPercentage
        );
        await this.createLeaderboardEntries(sortedWeekly, 'WEEKLY', today);
      }

      // Calculate monthly returns (last 30 days)
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const monthlyReturns = portfolioReturns.filter((p) => {
        const portfolio = portfolios.find((pf) => pf.id === p.portfolioId);
        return portfolio && portfolio.createdAt >= monthAgo;
      });

      if (monthlyReturns.length > 0) {
        const sortedMonthly = [...monthlyReturns].sort(
          (a, b) => b.returnPercentage - a.returnPercentage
        );
        await this.createLeaderboardEntries(sortedMonthly, 'MONTHLY', today);
      }

      logger.info('Leaderboard calculation completed successfully');
    } catch (error) {
      logger.error('Leaderboard calculation failed:', error);
      throw new AppError('Failed to calculate leaderboards', 500);
    }
  }

  /**
   * Create leaderboard entries for a period
   */
  private async createLeaderboardEntries(
    returns: Array<{
      userId: string;
      portfolioId: string;
      returnPercentage: number;
    }>,
    period: LeaderboardPeriod,
    snapshotDate: Date
  ) {
    // Delete existing entries for this period and date
    await prisma.leaderboard.deleteMany({
      where: {
        period,
        snapshotDate,
      },
    });

    // Create new entries
    const entries = returns.map((entry, index) => ({
      userId: entry.userId,
      portfolioId: entry.portfolioId,
      period,
      returnPercentage: entry.returnPercentage,
      rank: index + 1,
      snapshotDate,
    }));

    await prisma.leaderboard.createMany({
      data: entries,
    });

    logger.info(`Created ${entries.length} leaderboard entries for ${period}`);
  }

  /**
   * Get top performers for a period
   */
  async getTopPerformers(period: LeaderboardPeriod, limit: number = 10) {
    return await this.getLeaderboard(period, limit, 0);
  }

  /**
   * Get user's position on leaderboard
   */
  async getUserPosition(userId: string, period: LeaderboardPeriod) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await prisma.leaderboard.findFirst({
      where: {
        userId,
        period,
        snapshotDate: today,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!entry) {
      return null;
    }

    // Get total count for this period
    const totalCount = await prisma.leaderboard.count({
      where: {
        period,
        snapshotDate: today,
      },
    });

    return {
      rank: entry.rank,
      returnPercentage: entry.returnPercentage.toNumber(),
      totalParticipants: totalCount,
      percentile: ((totalCount - entry.rank + 1) / totalCount) * 100,
    };
  }
}

export default new LeaderboardService();
