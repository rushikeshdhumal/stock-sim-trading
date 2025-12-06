import { Router } from 'express';
import watchlistController from '../controllers/watchlistController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  addToWatchlistSchema,
  removeFromWatchlistSchema,
  checkWatchlistStatusSchema,
  checkBatchWatchlistStatusSchema,
} from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/watchlist - Get user's watchlist with real-time prices
router.get('/', watchlistController.getWatchlist);

// POST /api/watchlist - Add symbol to watchlist
router.post('/', validate(addToWatchlistSchema), watchlistController.addToWatchlist);

// POST /api/watchlist/check-batch - Check watchlist status for multiple symbols (batch operation)
router.post(
  '/check-batch',
  validate(checkBatchWatchlistStatusSchema),
  watchlistController.checkBatchWatchlistStatus
);

// GET /api/watchlist/check/:symbol - Check if symbol is in watchlist (specific route before generic)
router.get(
  '/check/:symbol',
  validate(checkWatchlistStatusSchema),
  watchlistController.checkWatchlistStatus
);

// DELETE /api/watchlist/symbol/:symbol - Remove symbol from watchlist by symbol (specific route before generic)
router.delete(
  '/symbol/:symbol',
  validate(checkWatchlistStatusSchema),
  watchlistController.removeFromWatchlistBySymbol
);

// DELETE /api/watchlist/:id - Remove symbol from watchlist by ID (generic route last)
router.delete(
  '/:id',
  validate(removeFromWatchlistSchema),
  watchlistController.removeFromWatchlist
);

export default router;
