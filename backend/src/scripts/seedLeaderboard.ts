/**
 * Seed Leaderboard Script
 * Populates the leaderboard table with synthetic data based on existing users and portfolios
 */

import getPrismaClient from '../config/database';
import logger from '../config/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = getPrismaClient();

interface PortfolioData {
  id: string;
  userId: string;
  cashBalance: Decimal;
  totalValue: Decimal | null;
  user: {
    username: string;
    startingBalance: Decimal;
  };
}

/**
 * Calculate return percentage for a portfolio
 */
function calculateReturnPercentage(
  currentValue: number,
  startingBalance: number
): number {
  return ((currentValue - startingBalance) / startingBalance) * 100;
}

/**
 * Generate a realistic return percentage with some randomization
 */
function generateReturnPercentage(baseReturn: number): number {
  // Add some randomness: ±5% variation
  const variation = (Math.random() - 0.5) * 10;
  return baseReturn + variation;
}

/**
 * Get the snapshot date for a given period
 */
function getSnapshotDate(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (period) {
    case 'DAILY':
      return today;
    case 'WEEKLY':
      // Last Monday
      const lastMonday = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      lastMonday.setDate(today.getDate() - daysToMonday);
      return lastMonday;
    case 'MONTHLY':
      // First day of current month
      return new Date(today.getFullYear(), today.getMonth(), 1);
    case 'ALL_TIME':
      // Epoch start
      return new Date('2024-01-01');
  }
}

/**
 * Create leaderboard entries for a specific period
 */
async function createLeaderboardForPeriod(
  portfolios: PortfolioData[],
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
) {
  logger.info(`Creating ${period} leaderboard entries...`);

  const snapshotDate = getSnapshotDate(period);

  // Calculate returns for each portfolio with some variation by period
  const portfolioReturns = portfolios.map((portfolio) => {
    const actualReturn = calculateReturnPercentage(
      Number(portfolio.totalValue || portfolio.cashBalance),
      Number(portfolio.user.startingBalance)
    );

    // Adjust returns based on period (shorter periods have more volatility)
    let adjustedReturn = actualReturn;
    switch (period) {
      case 'DAILY':
        // Daily returns are smaller and more volatile
        adjustedReturn = (actualReturn / 30) + (Math.random() - 0.5) * 5;
        break;
      case 'WEEKLY':
        // Weekly returns
        adjustedReturn = (actualReturn / 10) + (Math.random() - 0.5) * 8;
        break;
      case 'MONTHLY':
        // Monthly returns
        adjustedReturn = (actualReturn / 3) + (Math.random() - 0.5) * 10;
        break;
      case 'ALL_TIME':
        // All-time returns are the actual calculated returns
        adjustedReturn = generateReturnPercentage(actualReturn);
        break;
    }

    return {
      portfolioId: portfolio.id,
      userId: portfolio.userId,
      username: portfolio.user.username,
      returnPercentage: adjustedReturn,
    };
  });

  // Sort by return percentage (descending)
  portfolioReturns.sort((a, b) => b.returnPercentage - a.returnPercentage);

  // Create leaderboard entries with ranks
  const leaderboardEntries = portfolioReturns.map((item, index) => ({
    userId: item.userId,
    portfolioId: item.portfolioId,
    period,
    returnPercentage: item.returnPercentage,
    rank: index + 1,
    snapshotDate,
  }));

  // Bulk insert
  const result = await prisma.leaderboard.createMany({
    data: leaderboardEntries,
    skipDuplicates: true,
  });

  logger.info(
    `✓ Created ${result.count} ${period} leaderboard entries (${portfolioReturns.length} portfolios ranked)`
  );

  // Show top 3
  const top3 = portfolioReturns.slice(0, 3);
  top3.forEach((item, index) => {
    logger.info(
      `  ${index + 1}. ${item.username}: ${item.returnPercentage.toFixed(2)}%`
    );
  });

  return result.count;
}

/**
 * Main function to seed leaderboard
 */
async function seedLeaderboard() {
  try {
    logger.info('=== Starting Leaderboard Seeding ===\n');

    // Fetch all portfolios with user data
    const portfolios = await prisma.portfolio.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
            startingBalance: true,
          },
        },
      },
    });

    if (portfolios.length === 0) {
      logger.warn('No active portfolios found. Please create some users and portfolios first.');
      return;
    }

    logger.info(`Found ${portfolios.length} active portfolios\n`);

    // Clear existing leaderboard data
    logger.info('Clearing existing leaderboard data...');
    const deleted = await prisma.leaderboard.deleteMany({});
    logger.info(`✓ Deleted ${deleted.count} existing leaderboard entries\n`);

    // Create leaderboard entries for each period
    let totalCreated = 0;

    totalCreated += await createLeaderboardForPeriod(portfolios, 'DAILY');
    console.log('');

    totalCreated += await createLeaderboardForPeriod(portfolios, 'WEEKLY');
    console.log('');

    totalCreated += await createLeaderboardForPeriod(portfolios, 'MONTHLY');
    console.log('');

    totalCreated += await createLeaderboardForPeriod(portfolios, 'ALL_TIME');
    console.log('');

    logger.info(`=== Leaderboard Seeding Complete ===`);
    logger.info(`Total leaderboard entries created: ${totalCreated}`);
    logger.info(`Portfolios ranked: ${portfolios.length}`);
    logger.info(`Periods: DAILY, WEEKLY, MONTHLY, ALL_TIME\n`);

    // Show sample query
    logger.info('Sample query to view daily leaderboard:');
    logger.info('  SELECT * FROM leaderboards WHERE period = \'DAILY\' ORDER BY rank ASC LIMIT 10;\n');
  } catch (error) {
    logger.error('Error seeding leaderboard:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedLeaderboard()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedLeaderboard;
