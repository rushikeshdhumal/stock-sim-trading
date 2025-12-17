/**
 * Portfolio Service
 *
 * Service layer for managing user portfolios and holdings.
 *
 * FEATURES:
 * - Fetch all portfolios for current user
 * - Get detailed portfolio with holdings
 * - Create new portfolios
 * - Calculate total portfolio value (cash + holdings)
 * - Track portfolio performance over time
 *
 * PORTFOLIO STRUCTURE:
 * - Each user starts with a default portfolio ($100,000 cash)
 * - Users can create multiple portfolios
 * - Each portfolio tracks cash balance, holdings, and trades
 * - Total value = cash + sum(holdings × current price)
 *
 * USAGE:
 * ```typescript
 * import portfolioService from './services/portfolioService';
 *
 * const portfolios = await portfolioService.getPortfolios();
 * const details = await portfolioService.getPortfolioById(portfolioId);
 * ```
 */
import apiClient from './api';
import type { Portfolio, PortfolioWithHoldings } from '../types/index.js';

export const portfolioService = {
  /**
   * Get All Portfolios
   *
   * Fetches all portfolios owned by the current user.
   * Returns basic portfolio info (id, name, cash balance, total value).
   *
   * @returns {Promise<Portfolio[]>} Array of user's portfolios
   */
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get<{ data: Portfolio[] }>('/portfolios');
    return response.data.data;
  },

  /**
   * Get Portfolio Details
   *
   * Fetches detailed portfolio information including all holdings.
   * Holdings include symbol, quantity, average cost, and current value.
   *
   * @param {string} id - Portfolio ID
   * @returns {Promise<PortfolioWithHoldings>} Portfolio with holdings array
   */
  async getPortfolioById(id: string): Promise<PortfolioWithHoldings> {
    const response = await apiClient.get<{ data: PortfolioWithHoldings }>(`/portfolios/${id}`);
    return response.data.data;
  },

  /**
   * Create New Portfolio
   *
   * Creates a new portfolio for the current user.
   *
   * @param {string} name - Portfolio name
   * @param {number} [initialBalance=100000] - Starting cash balance (default: $100,000)
   * @returns {Promise<Portfolio>} Newly created portfolio
   */
  async createPortfolio(name: string, initialBalance?: number): Promise<Portfolio> {
    const response = await apiClient.post<{ data: Portfolio }>('/portfolios', {
      name,
      initialBalance,
    });
    return response.data.data;
  },

  /**
   * Get Portfolio Total Value
   *
   * Calculates and returns the total value of a portfolio.
   * Total value = cash balance + sum(holdings quantity × current market price)
   *
   * @param {string} id - Portfolio ID
   * @returns {Promise<object>} Portfolio ID and total value
   */
  async getPortfolioValue(id: string): Promise<{ portfolioId: string; totalValue: number }> {
    const response = await apiClient.get<{
      data: { portfolioId: string; totalValue: number };
    }>(`/portfolios/${id}/value`);
    return response.data.data;
  },

  /**
   * Get Portfolio Performance Metrics
   *
   * Retrieves historical performance data for a portfolio including:
   * - Total return percentage
   * - Daily/weekly/monthly returns
   * - Performance chart data points
   *
   * @param {string} id - Portfolio ID
   * @returns {Promise<any>} Performance metrics and historical data
   */
  async getPortfolioPerformance(id: string): Promise<any> {
    const response = await apiClient.get(`/portfolios/${id}/performance`);
    return response.data.data;
  },
};

export default portfolioService;
