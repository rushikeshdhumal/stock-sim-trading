// User types
export interface User {
  id: string;
  username: string;
  email: string;
  startingBalance: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Portfolio types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  createdAt: string;
  isActive: boolean;
}

export interface Holding {
  id: string;
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

export interface PortfolioWithHoldings extends Portfolio {
  holdings: Holding[];
}

// Trade types
export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  tradeType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalValue: number;
  executedAt: string;
}

export interface TradeRequest {
  portfolioId: string;
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  quantity: number;
}

export interface TradeResult {
  trade: Trade;
  portfolio: {
    cashBalance: number;
    totalValue: number;
  };
}

// Market data types
export interface MarketQuote {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  currentPrice: number;
  change24h: number;
  changePercentage: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  portfolioId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  returnPercentage: number;
  rank: number;
  user?: {
    username: string;
  };
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeIcon?: string;
  criteriaType: string;
  criteriaValue: any;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
}

// Challenge types
export interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: 'BEAT_MARKET' | 'TOP_PERCENTAGE' | 'SPECIFIC_RETURN';
  targetValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  portfolioId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  progress?: number;
  joinedAt: string;
  completedAt?: string;
  challenge: Challenge;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}
