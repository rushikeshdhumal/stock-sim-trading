import apiClient from './api';
import type { TradeRequest, TradeResult, Trade } from '../types/index.js';

export const tradeService = {
  async executeBuy(trade: TradeRequest): Promise<TradeResult> {
    const response = await apiClient.post<{ data: TradeResult }>('/trades/buy', trade);
    return response.data.data;
  },

  async executeSell(trade: TradeRequest): Promise<TradeResult> {
    const response = await apiClient.post<{ data: TradeResult }>('/trades/sell', trade);
    return response.data.data;
  },

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
