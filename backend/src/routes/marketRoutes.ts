import { Router } from 'express';
import marketController from '../controllers/marketController';
import { validate } from '../middleware/validation';
import { getQuoteSchema, searchMarketSchema } from '../types';

const router = Router();

// Market data routes (public)
router.get('/search', validate(searchMarketSchema), marketController.search);
router.get('/quote/:symbol', validate(getQuoteSchema), marketController.getQuote);
router.get('/trending', marketController.getTrending);
router.get('/popular', marketController.getPopular);

export default router;
