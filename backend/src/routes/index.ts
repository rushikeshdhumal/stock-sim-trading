import { Router } from 'express';
import authRoutes from './authRoutes';
import portfolioRoutes from './portfolioRoutes';
import tradeRoutes from './tradeRoutes';
import marketRoutes from './marketRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/trades', tradeRoutes);
router.use('/market', marketRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
