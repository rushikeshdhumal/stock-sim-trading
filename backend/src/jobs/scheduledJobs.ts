import cron from 'node-cron';
import leaderboardService from '../services/leaderboardService';
import logger from '../config/logger';
import getPrismaClient from '../config/database';

const prisma = getPrismaClient();

/**
 * Cleanup stale market data cache entries
 * Removes entries older than 24 hours
 */
async function cleanupStaleMarketData() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.marketDataCache.deleteMany({
    where: {
      lastUpdated: {
        lt: oneDayAgo,
      },
    },
  });

  logger.info(`Cleaned up ${result?.count ?? 0} stale market data cache entries`);
}

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = () => {
  logger.info('Initializing scheduled jobs...');

  // Calculate leaderboards daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily leaderboard calculation...');
    try {
      await leaderboardService.calculateLeaderboards();
      logger.info('Daily leaderboard calculation completed');
    } catch (error) {
      logger.error('Daily leaderboard calculation failed:', error);
    }
  });

  // Calculate leaderboards every 2 hours (reduced frequency to minimize API calls)
  cron.schedule('0 */2 * * *', async () => {
    // Get current time in EST/EDT (America/New_York timezone)
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = estTime.getHours();
    const dayOfWeek = estTime.getDay();

    // Only run during market hours (9 AM - 4 PM EST/EDT, Mon-Fri)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMarketHours = hour >= 9 && hour <= 16;

    if (isWeekday && isMarketHours) {
      logger.info(`Running scheduled leaderboard update (EST time: ${estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })})...`);
      try {
        await leaderboardService.calculateLeaderboards();
        logger.info('Scheduled leaderboard update completed');
      } catch (error) {
        logger.error('Scheduled leaderboard update failed:', error);
      }
    } else {
      logger.debug(`Skipping leaderboard update - outside market hours (EST time: ${estTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}, ${isWeekday ? 'weekday' : 'weekend'})`);
    }
  });

  // Cleanup stale market data cache daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running market data cache cleanup...');
    try {
      await cleanupStaleMarketData();
      logger.info('Market data cache cleanup completed');
    } catch (error) {
      logger.error('Market data cache cleanup failed:', error);
    }
  });

  logger.info('Scheduled jobs initialized successfully');
};

export default initializeScheduledJobs;
