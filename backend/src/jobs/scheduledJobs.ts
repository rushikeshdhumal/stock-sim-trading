import cron from 'node-cron';
import leaderboardService from '../services/leaderboardService';
import logger from '../config/logger';

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

  // Calculate leaderboards every hour during market hours (9 AM - 4 PM EST)
  cron.schedule('0 9-16 * * 1-5', async () => {
    logger.info('Running hourly leaderboard update...');
    try {
      await leaderboardService.calculateLeaderboards();
      logger.info('Hourly leaderboard update completed');
    } catch (error) {
      logger.error('Hourly leaderboard update failed:', error);
    }
  });

  // Update market data cache every 15 minutes during market hours
  // This is a placeholder - implement when you have more market data logic
  cron.schedule('*/15 9-16 * * 1-5', () => {
    logger.info('Market data cache update (placeholder)');
    // TODO: Implement market data cache update logic
  });

  logger.info('Scheduled jobs initialized successfully');
};

export default initializeScheduledJobs;
