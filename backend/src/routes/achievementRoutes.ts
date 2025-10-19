import { Router } from 'express';
import achievementController from '../controllers/achievementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', achievementController.getAllAchievements);
router.get('/user/:userId', achievementController.getUserAchievements);

// Protected routes
router.get('/me', authenticateToken, achievementController.getMyAchievements);
router.get('/progress', authenticateToken, achievementController.getMyProgress);
router.post('/check', authenticateToken, achievementController.checkAchievements);

// Admin routes (should add admin middleware in production)
router.post('/', achievementController.createAchievement);

export default router;
