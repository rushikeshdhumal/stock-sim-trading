import apiClient from './api';
import type { Portfolio, PortfolioWithHoldings } from '../types/index.js';

export const portfolioService = {
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get<{ data: Portfolio[] }>('/portfolios');
    return response.data.data;
  },

  async getPortfolioById(id: string): Promise<PortfolioWithHoldings> {
    const response = await apiClient.get<{ data: PortfolioWithHoldings }>(`/portfolios/${id}`);
    return response.data.data;
  },

  async createPortfolio(name: string, initialBalance?: number): Promise<Portfolio> {
    const response = await apiClient.post<{ data: Portfolio }>('/portfolios', {
      name,
      initialBalance,
    });
    return response.data.data;
  },

  async getPortfolioValue(id: string): Promise<{ portfolioId: string; totalValue: number }> {
    const response = await apiClient.get<{
      data: { portfolioId: string; totalValue: number };
    }>(`/portfolios/${id}/value`);
    return response.data.data;
  },

  async getPortfolioPerformance(id: string): Promise<any> {
    const response = await apiClient.get(`/portfolios/${id}/performance`);
    return response.data.data;
  },
};

export default portfolioService;
