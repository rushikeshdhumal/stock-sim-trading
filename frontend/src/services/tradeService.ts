/**
 * Trade Service
 *
 * Service layer for executing stock trades and fetching trade history.
 *
 * FEATURES:
 * - Execute buy orders (validates cash balance)
 * - Execute sell orders (validates holdings)
 * - Fetch trade history with pagination and filtering
 * - Automatic portfolio value updates after trades
 * - Achievement checks after successful trades
 *
 * TRADE EXECUTION FLOW:
 * 1. Frontend validates trade request
 * 2. Service sends trade to backend API
 * 3. Backend validates (funds/holdings, market price)
 * 4. Trade executed in database transaction
 * 5. Portfolio and holdings updated atomically
 * 6. Achievement system checks for new achievements
 * 7. Updated portfolio state returned to frontend
 *
 * USAGE:
 * ```typescript
 * import tradeService from './services/tradeService';
 *
 * const result = await tradeService.executeBuy({
 *   portfolioId: 'abc123',
 *   symbol: 'AAPL',
 *   quantity: 10
 * });
 * ```
 */
import apiClient from './api';
import type { TradeRequest, TradeResult, Trade } from '../types/index.js';

export const tradeService = {
  /**
   * Execute Buy Order
   *
   * Purchases shares of a stock and adds them to portfolio holdings.
   * Validates that user has sufficient cash balance before executing.
   *
   * @param {TradeRequest} trade - Trade request object
   * @param {string} trade.portfolioId - Portfolio ID to trade in
   * @param {string} trade.symbol - Stock symbol to buy
   * @param {number} trade.quantity - Number of shares to buy
   * @returns {Promise<TradeResult>} Trade result with updated portfolio state
   * @throws {Error} If insufficient funds or invalid symbol
   */
  async executeBuy(trade: TradeRequest): Promise<TradeResult> {
    const response = await apiClient.post<{ data: TradeResult }>('/trades/buy', trade);
    return response.data.data;
  },

  /**
   * Execute Sell Order
   *
   * Sells shares of a stock from portfolio holdings.
   * Validates that user has sufficient shares before executing.
   *
   * @param {TradeRequest} trade - Trade request object
   * @param {string} trade.portfolioId - Portfolio ID to trade in
   * @param {string} trade.symbol - Stock symbol to sell
   * @param {number} trade.quantity - Number of shares to sell
   * @returns {Promise<TradeResult>} Trade result with updated portfolio state
   * @throws {Error} If insufficient holdings or invalid symbol
   */
  async executeSell(trade: TradeRequest): Promise<TradeResult> {
    const response = await apiClient.post<{ data: TradeResult }>('/trades/sell', trade);
    return response.data.data;
  },

  /**
   * Get Trade History
   *
   * Fetches paginated trade history for a portfolio with optional filtering.
   *
   * @param {object} params - Query parameters
   * @param {string} params.portfolioId - Portfolio ID to fetch trades for
   * @param {number} [params.limit=50] - Max number of trades to return
   * @param {number} [params.offset=0] - Number of trades to skip (for pagination)
   * @param {string} [params.symbol] - Filter by specific stock symbol (optional)
   * @returns {Promise<object>} Object with trades array and total count
   */
  async getTradeHistory(params: {
    portfolioId: string;
    limit?: number;
    offset?: number;
    symbol?: string;
  }): Promise<{ trades: Trade[]; total: number }> {
    const response = await apiClient.get<{ data: { trades: Trade[]; total: number } }>(
      '/trades/history',
      { params }
    );
    return response.data.data;
  },
};

export default tradeService;
