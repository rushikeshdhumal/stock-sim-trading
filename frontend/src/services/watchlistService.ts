import api from './api';

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  notes?: string;
  addedAt: string;
  currentPrice?: number;
  change24h?: number;
  changePercentage?: number;
}

const watchlistService = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await api.get('/watchlist');
    return response.data.data;
  },

  addToWatchlist: async (symbol: string, assetType: 'STOCK' | 'CRYPTO', notes?: string) => {
    const response = await api.post('/watchlist', { symbol, assetType, notes });
    return response.data.data;
  },

  removeFromWatchlist: async (id: string) => {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  removeFromWatchlistBySymbol: async (symbol: string) => {
    const response = await api.delete(`/watchlist/symbol/${symbol}`);
    return response.data;
  },

  checkWatchlistStatus: async (symbol: string): Promise<boolean> => {
    const response = await api.get(`/watchlist/check/${symbol}`);
    return response.data.data.inWatchlist;
  },

  checkBatchWatchlistStatus: async (symbols: string[]): Promise<Record<string, boolean>> => {
    const response = await api.post('/watchlist/check-batch', { symbols });
    return response.data.data;
  },
};

export default watchlistService;
