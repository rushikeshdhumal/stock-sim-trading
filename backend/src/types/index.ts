import { z } from 'zod';

// Authentication schemas
export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    email: z.string().email().optional(),
  }),
});

// Portfolio schemas
export const createPortfolioSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Portfolio name is required').max(100),
    initialBalance: z.number().positive('Initial balance must be positive').optional(),
  }),
});

// Trade schemas
export const executeTradeSchema = z.object({
  body: z.object({
    portfolioId: z.string().uuid('Invalid portfolio ID'),
    symbol: z.string().min(1, 'Symbol is required').max(20),
    assetType: z.enum(['STOCK', 'CRYPTO']),
    tradeType: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive('Quantity must be positive'),
  }),
});

export const validateTradeSchema = z.object({
  body: z.object({
    portfolioId: z.string().uuid(),
    symbol: z.string().min(1).max(20),
    assetType: z.enum(['STOCK', 'CRYPTO']),
    tradeType: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive(),
  }),
});

// Market data schemas
export const getQuoteSchema = z.object({
  params: z.object({
    symbol: z.string().min(1).max(20),
  }),
});

export const searchMarketSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    type: z.enum(['stock', 'crypto', 'all']).optional().default('all'),
  }),
});

// Challenge schemas
export const joinChallengeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    portfolioId: z.string().uuid(),
  }),
});

// Types
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  startingBalance: number;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface PortfolioWithHoldings {
  id: string;
  userId: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  holdings: Array<{
    id: string;
    symbol: string;
    assetType: string;
    quantity: number;
    averageCost: number;
    currentPrice?: number;
    currentValue?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
  }>;
  createdAt: Date;
}

export interface TradeResult {
  trade: {
    id: string;
    symbol: string;
    assetType: string;
    tradeType: string;
    quantity: number;
    price: number;
    totalValue: number;
    executedAt: Date;
  };
  portfolio: {
    cashBalance: number;
    totalValue: number;
  };
}

export interface MarketQuote {
  symbol: string;
  assetType: string;
  currentPrice: number;
  change24h: number;
  changePercentage: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: Date;
}
