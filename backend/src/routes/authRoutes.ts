import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema, updateProfileSchema } from '../types';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, validate(updateProfileSchema), authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);

export default router;
