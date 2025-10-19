import { Router } from 'express';
import leaderboardController from '../controllers/leaderboardController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (can view leaderboards without login)
router.get('/:period', optionalAuth, leaderboardController.getLeaderboard);
router.get('/top/:period', leaderboardController.getTopPerformers);

// Protected routes
router.get('/me/ranks', authenticateToken, leaderboardController.getMyRanks);
router.get('/position/:period', authenticateToken, leaderboardController.getUserPosition);
router.get('/user/:userId', leaderboardController.getUserRanks);

// Admin/Cron route (should be protected with API key in production)
router.post('/calculate', leaderboardController.calculateLeaderboards);

export default router;
