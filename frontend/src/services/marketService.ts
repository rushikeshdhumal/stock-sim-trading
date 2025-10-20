import apiClient from './api';
import type { MarketQuote } from '../types/index.js';

export const marketService = {
  async search(query: string, type?: 'stock' | 'crypto' | 'all'): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>('/market/search', {
      params: { q: query, type },
    });
    return response.data.data;
  },

  async getQuote(symbol: string): Promise<MarketQuote> {
    const response = await apiClient.get<{ data: MarketQuote }>(`/market/quote/${symbol}`);
    return response.data.data;
  },

  async getTrending(): Promise<MarketQuote[]> {
    const response = await apiClient.get<{ data: MarketQuote[] }>('/market/trending');
    return response.data.data;
  },

  async getPopular(): Promise<MarketQuote[]> {
    const response = await apiClient.get<{ data: MarketQuote[] }>('/market/popular');
    return response.data.data;
  },
};

export default marketService;
