/**
 * TypeScript Type Definitions
 *
 * Centralized type definitions for the entire frontend application.
 * These types ensure type safety and match the backend API contracts.
 *
 * CATEGORIES:
 * - User & Authentication types
 * - Portfolio & Holdings types
 * - Trade types
 * - Market data types
 * - Leaderboard types
 * - Achievement types
 * - Challenge types
 * - API response types
 */

/**
 * User Types
 */

// User profile data
export interface User {
  id: string;
  username: string;
  email: string;
  startingBalance: number;
  createdAt: string;
}

// Authentication response from login/register endpoints
export interface AuthResponse {
  user: User;
  accessToken: string; // JWT token (7-day expiry)
  refreshToken: string; // Refresh token (30-day expiry)
}

/**
 * Portfolio Types
 */

// Portfolio summary data
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  createdAt: string;
  isActive: boolean;
}

// Individual stock holding in a portfolio
export interface Holding {
  id: string;
  symbol: string; // Stock symbol (e.g., "AAPL")
  assetType: 'STOCK';
  quantity: number; // Number of shares owned
  averageCost: number; // Average cost per share
  currentPrice?: number; // Current market price (optional, fetched separately)
  currentValue?: number; // Total value (quantity × currentPrice)
  profitLoss?: number; // Dollar profit/loss
  profitLossPercentage?: number; // Percentage profit/loss
}

// Portfolio with full holdings details
export interface PortfolioWithHoldings extends Portfolio {
  holdings: Holding[];
}

/**
 * Trade Types
 */

// Trade history record
export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  assetType: 'STOCK';
  tradeType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalValue: number;
  executedAt: string;
}

// Trade request payload for buy/sell
export interface TradeRequest {
  portfolioId: string;
  symbol: string;
  assetType: 'STOCK';
  quantity: number; // Number of shares to buy/sell
}

// Trade execution result
export interface TradeResult {
  trade: Trade; // Completed trade record
  portfolio: {
    cashBalance: number; // Updated cash balance after trade
    totalValue: number; // Updated total portfolio value
  };
}

/**
 * Market Data Types
 */

// Real-time stock quote
export interface MarketQuote {
  symbol: string;
  assetType: 'STOCK';
  currentPrice: number;
  change24h: number;
  changePercentage: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
}

/**
 * Leaderboard Types
 */

// Leaderboard ranking entry
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

/**
 * Achievement Types
 */

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeIcon?: string;
  criteriaType: string;
  criteriaValue: any;
}

// User's earned achievement
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string; // Timestamp when achievement was earned
  achievement: Achievement;
}

/**
 * Challenge Types
 */

// Trading challenge definition
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

// User's participation in a challenge
export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  portfolioId: string; // Portfolio used for this challenge
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  progress?: number; // Progress percentage (0-100)
  joinedAt: string;
  completedAt?: string;
  challenge: Challenge;
}

/**
 * API Response Types
 */

// Generic success response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API error response
export interface ApiError {
  success: false;
  error: string; // Error message
  details?: any; // Additional error details (validation errors, etc.)
}
