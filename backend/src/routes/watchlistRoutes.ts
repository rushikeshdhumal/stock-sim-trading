import { Router } from 'express';
import watchlistController from '../controllers/watchlistController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  addToWatchlistSchema,
  removeFromWatchlistSchema,
  checkWatchlistStatusSchema,
} from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/watchlist - Get user's watchlist with real-time prices
router.get('/', watchlistController.getWatchlist);

// POST /api/watchlist - Add symbol to watchlist
router.post('/', validate(addToWatchlistSchema), watchlistController.addToWatchlist);

// DELETE /api/watchlist/:id - Remove symbol from watchlist
router.delete(
  '/:id',
  validate(removeFromWatchlistSchema),
  watchlistController.removeFromWatchlist
);

// GET /api/watchlist/check/:symbol - Check if symbol is in watchlist
router.get(
  '/check/:symbol',
  validate(checkWatchlistStatusSchema),
  watchlistController.checkWatchlistStatus
);

export default router;
