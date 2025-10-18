import { Router } from 'express';
import tradeController from '../controllers/tradeController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { tradeLimiter } from '../middleware/rateLimiter';
import { executeTradeSchema, validateTradeSchema } from '../types';

const router = Router();

// All trade routes require authentication
router.use(authenticateToken);

router.post('/buy', tradeLimiter, validate(executeTradeSchema), tradeController.executeBuy);
router.post('/sell', tradeLimiter, validate(executeTradeSchema), tradeController.executeSell);
router.get('/history', tradeController.getTradeHistory);
router.post('/validate', validate(validateTradeSchema), tradeController.validateTrade);

export default router;
