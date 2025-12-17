/**
 * Market Service
 *
 * Service layer for fetching market data from the backend API.
 *
 * FEATURES:
 * - Search stocks by symbol or name
 * - Get real-time quote for a specific symbol
 * - Fetch trending stocks (popular tech giants)
 * - Get most traded stocks on the platform
 *
 * DATA CACHING:
 * The backend implements 3-tier caching (Redis → Database → API),
 * so most requests return near-instantly from cache.
 *
 * USAGE:
 * ```typescript
 * import marketService from './services/marketService';
 *
 * const quote = await marketService.getQuote('AAPL');
 * const trending = await marketService.getTrending();
 * ```
 */

import apiClient from './api';
import type { MarketQuote } from '../types/index.js';

export const marketService = {
  /**
   * Search Stocks/Crypto
   *
   * Searches for assets by symbol or partial symbol.
   * Returns up to 10 matching results from cache or API.
   *
   * @param {string} query - Search term (e.g., "AAPL", "APP", "Tesla")
   * @param {'stock' | 'crypto' | 'all'} [type='all'] - Asset type filter
   * @returns {Promise<any[]>} Array of matching assets
   */
  async search(query: string, type?: 'stock' | 'crypto' | 'all'): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>('/market/search', {
      params: { q: query, type },
    });
    return response.data.data;
  },

  /**
   * Get Quote for Symbol
   *
   * Fetches real-time quote data for a specific stock symbol.
   * Data served from cache (< 10ms) if available, otherwise fetched from API.
   *
   * @param {string} symbol - Stock symbol (e.g., "AAPL", "TSLA")
   * @returns {Promise<MarketQuote>} Quote with price, change, volume, etc.
   */
  async getQuote(symbol: string): Promise<MarketQuote> {
    const response = await apiClient.get<{ data: MarketQuote }>(`/market/quote/${symbol}`);
    return response.data.data;
  },

  /**
   * Get Trending Stocks
   *
   * Returns a curated list of 10 trending stocks (FAANG+ tech giants).
   * Uses batch API for fast parallel fetching.
   *
   * @returns {Promise<MarketQuote[]>} Array of 10 trending stock quotes
   */
  async getTrending(): Promise<MarketQuote[]> {
    const response = await apiClient.get<{ data: MarketQuote[] }>('/market/trending');
    return response.data.data;
  },

  /**
   * Get Most Traded Stocks on Platform
   *
   * Returns the top 10 most actively traded stocks by users on this platform.
   * Determined by total trade count (buy + sell).
   *
   * @returns {Promise<MarketQuote[]>} Array of top 10 most traded stock quotes
   */
  async getPopular(): Promise<MarketQuote[]> {
    const response = await apiClient.get<{ data: MarketQuote[] }>('/market/popular');
    return response.data.data;
  },
};

export default marketService;
