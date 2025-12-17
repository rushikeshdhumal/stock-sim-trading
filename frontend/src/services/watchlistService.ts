/**
 * Watchlist Service
 *
 * Service layer for managing user watchlists (saved stocks for tracking).
 *
 * FEATURES:
 * - Add stocks to watchlist with optional notes
 * - Remove stocks by ID or symbol
 * - Fetch watchlist with current price data
 * - Check if symbol is in watchlist (single or batch)
 *
 * USE CASES:
 * - Track stocks of interest without buying
 * - Monitor price changes on favorite stocks
 * - Quick access to frequently traded stocks
 * - Research stocks before trading
 *
 * PRICE DATA:
 * - Watchlist items include current price when fetched
 * - Prices served from backend cache (< 10ms)
 * - 24-hour price change and percentage included
 *
 * USAGE:
 * ```typescript
 * import watchlistService from './services/watchlistService';
 *
 * await watchlistService.addToWatchlist('AAPL', 'STOCK', 'Tech giant');
 * const items = await watchlistService.getWatchlist();
 * const isWatched = await watchlistService.checkWatchlistStatus('AAPL');
 * ```
 */
import api from './api';

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: 'STOCK';
  notes?: string;
  addedAt: string;
  currentPrice?: number;
  change24h?: number;
  changePercentage?: number;
}

const watchlistService = {
  /**
   * Get Watchlist
   *
   * Fetches all stocks in the user's watchlist with current price data.
   * Price data includes current price, 24-hour change, and percentage change.
   *
   * @returns {Promise<WatchlistItem[]>} Array of watchlist items with price data
   */
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await api.get('/watchlist');
    return response.data.data;
  },

  /**
   * Add to Watchlist
   *
   * Adds a stock to the user's watchlist with optional notes.
   *
   * @param {string} symbol - Stock symbol to add (e.g., "AAPL", "TSLA")
   * @param {'STOCK'} assetType - Asset type (currently only supports 'STOCK')
   * @param {string} [notes] - Optional notes about why this stock is being watched
   * @returns {Promise<WatchlistItem>} The newly created watchlist item
   * @throws {Error} If symbol is invalid or already in watchlist
   */
  addToWatchlist: async (symbol: string, assetType: 'STOCK', notes?: string) => {
    const response = await api.post('/watchlist', { symbol, assetType, notes });
    return response.data.data;
  },

  /**
   * Remove from Watchlist (by ID)
   *
   * Removes a stock from the watchlist using its watchlist item ID.
   *
   * @param {string} id - Watchlist item ID
   * @returns {Promise<any>} Deletion confirmation
   */
  removeFromWatchlist: async (id: string) => {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  /**
   * Remove from Watchlist (by Symbol)
   *
   * Removes a stock from the watchlist using its symbol.
   * More convenient when symbol is known but item ID is not.
   *
   * @param {string} symbol - Stock symbol to remove (e.g., "AAPL")
   * @returns {Promise<any>} Deletion confirmation
   */
  removeFromWatchlistBySymbol: async (symbol: string) => {
    const response = await api.delete(`/watchlist/symbol/${symbol}`);
    return response.data;
  },

  /**
   * Check Watchlist Status
   *
   * Checks if a specific symbol is in the user's watchlist.
   * Used for showing "Add to Watchlist" vs "Remove from Watchlist" buttons.
   *
   * @param {string} symbol - Stock symbol to check
   * @returns {Promise<boolean>} True if symbol is in watchlist, false otherwise
   */
  checkWatchlistStatus: async (symbol: string): Promise<boolean> => {
    const response = await api.get(`/watchlist/check/${symbol}`);
    return response.data.data.inWatchlist;
  },

  /**
   * Check Batch Watchlist Status
   *
   * Checks watchlist status for multiple symbols at once.
   * More efficient than checking each symbol individually.
   *
   * @param {string[]} symbols - Array of stock symbols to check
   * @returns {Promise<Record<string, boolean>>} Object mapping symbol → boolean (in watchlist)
   */
  checkBatchWatchlistStatus: async (symbols: string[]): Promise<Record<string, boolean>> => {
    const response = await api.post('/watchlist/check-batch', { symbols });
    return response.data.data;
  },
};

export default watchlistService;
