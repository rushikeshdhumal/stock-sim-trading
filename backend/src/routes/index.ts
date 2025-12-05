import { Router } from 'express';
import authRoutes from './authRoutes';
import portfolioRoutes from './portfolioRoutes';
import tradeRoutes from './tradeRoutes';
import marketRoutes from './marketRoutes';
import leaderboardRoutes from './leaderboardRoutes';
import achievementRoutes from './achievementRoutes';
import watchlistRoutes from './watchlistRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/trades', tradeRoutes);
router.use('/market', marketRoutes);
router.use('/leaderboards', leaderboardRoutes);
router.use('/achievements', achievementRoutes);
router.use('/watchlist', watchlistRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
