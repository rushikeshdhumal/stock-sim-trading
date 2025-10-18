import { Router } from 'express';
import portfolioController from '../controllers/portfolioController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createPortfolioSchema } from '../types';

const router = Router();

// All portfolio routes require authentication
router.use(authenticateToken);

router.get('/', portfolioController.getPortfolios);
router.post('/', validate(createPortfolioSchema), portfolioController.createPortfolio);
router.get('/:id', portfolioController.getPortfolioById);
router.get('/:id/value', portfolioController.getPortfolioValue);
router.get('/:id/performance', portfolioController.getPortfolioPerformance);

export default router;
