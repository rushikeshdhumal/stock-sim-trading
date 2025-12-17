/**
 * Trade Service
 *
 * Handles stock trading operations including trade execution, validation, and history.
 *
 * KEY RESPONSIBILITIES:
 * - Execute buy/sell trades with market price validation
 * - Update portfolio cash balance and holdings
 * - Maintain complete trade history for auditing
 * - Validate trades (sufficient funds, sufficient holdings)
 * - Trigger achievement checks after trades
 *
 * TRADE EXECUTION FLOW:
 * 1. Verify portfolio ownership
 * 2. Fetch current market price
 * 3. Validate trade (funds/holdings check)
 * 4. Execute in database transaction:
 *    - Create trade record
 *    - Update cash balance
 *    - Update holdings (create/update/delete)
 * 5. Recalculate portfolio value
 * 6. Check for new achievements
 *
 * IMPORTANT: All trade operations use database transactions to ensure
 * atomicity and prevent data inconsistencies.
 */

import { Trade } from '@prisma/client';
import getPrismaClient from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { TradeResult } from '../types';
import logger from '../config/logger';
import marketDataService from './marketDataService';
import portfolioService from './portfolioService';
import achievementService from './achievementService';

const prisma = getPrismaClient();

export class TradeService {
  /**
   * Execute a Trade (BUY or SELL)
   *
   * Executes a complete trading operation with validation and portfolio updates.
   * Uses database transaction to ensure atomicity.
   *
   * @param {string} portfolioId - Portfolio ID to trade in
   * @param {string} userId - User ID (for ownership verification)
   * @param {string} symbol - Stock symbol (e.g., "AAPL")
   * @param {'STOCK' | 'CRYPTO'} assetType - Type of asset
   * @param {'BUY' | 'SELL'} tradeType - Trade direction
   * @param {number} quantity - Number of shares to trade
   * @returns {Promise<TradeResult>} Trade result with updated portfolio info
   * @throws {AppError} If portfolio not found, insufficient funds, or insufficient holdings
   */
  async executeTrade(
    portfolioId: string,
    userId: string,
    symbol: string,
    assetType: 'STOCK' | 'CRYPTO',
    tradeType: 'BUY' | 'SELL',
    quantity: number
  ): Promise<TradeResult> {
    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    // Get current market price
    const marketData = await marketDataService.getQuote(symbol);
    const price = marketData.currentPrice;
    const totalValue = price * quantity;

    // Validate trade
    await this.validateTrade(portfolio, tradeType, symbol, quantity, totalValue);

    // Execute trade in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create trade record
      const trade = await tx.trade.create({
        data: {
          portfolioId,
          symbol,
          assetType,
          tradeType,
          quantity,
          price,
          totalValue,
          executedAt: new Date(),
        },
      });

      // Update portfolio cash balance
      const newCashBalance =
        tradeType === 'BUY'
          ? portfolio.cashBalance.toNumber() - totalValue
          : portfolio.cashBalance.toNumber() + totalValue;

      await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
          cashBalance: newCashBalance,
        },
      });

      // Update holdings
      await portfolioService.updateHolding(portfolioId, symbol, assetType, quantity, price, tradeType);

      return trade;
    });

    // Calculate new portfolio value
    const newPortfolioValue = await portfolioService.calculatePortfolioValue(portfolioId, userId);

    logger.info(
      `Trade executed: ${tradeType} ${quantity} ${symbol} @ ${price} for portfolio ${portfolioId}`
    );

    // Get updated portfolio
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });

    // Check for achievements (async, don't wait)
    achievementService.checkAndAwardAchievements(userId).catch((error) => {
      logger.error('Achievement check failed after trade:', error);
    });

    return {
      trade: {
        id: result.id,
        symbol: result.symbol,
        assetType: result.assetType,
        tradeType: result.tradeType,
        quantity: result.quantity.toNumber(),
        price: result.price.toNumber(),
        totalValue: result.totalValue.toNumber(),
        executedAt: result.executedAt,
      },
      portfolio: {
        cashBalance: updatedPortfolio!.cashBalance.toNumber(),
        totalValue: newPortfolioValue,
      },
    };
  }

  /**
   * Validate trade before execution
   */
  async validateTrade(
    portfolio: any,
    tradeType: 'BUY' | 'SELL',
    symbol: string,
    quantity: number,
    totalValue: number
  ): Promise<{ valid: boolean; message?: string }> {
    if (quantity <= 0) {
      throw new AppError('Quantity must be positive', 400);
    }

    if (tradeType === 'BUY') {
      // Check if user has enough cash
      if (portfolio.cashBalance.toNumber() < totalValue) {
        throw new AppError('Insufficient funds', 400);
      }
    } else {
      // Check if user has enough holdings
      const holding = portfolio.holdings.find((h: any) => h.symbol === symbol);

      if (!holding) {
        throw new AppError('No holdings found for this symbol', 400);
      }

      if (holding.quantity.toNumber() < quantity) {
        throw new AppError(
          `Insufficient holdings. Available: ${holding.quantity.toNumber()}`,
          400
        );
      }
    }

    return { valid: true };
  }

  /**
   * Get trade history for a portfolio
   */
  async getTradeHistory(
    portfolioId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      symbol?: string;
      tradeType?: 'BUY' | 'SELL';
    }
  ): Promise<{ trades: Trade[]; total: number }> {
    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const where: any = { portfolioId };

    if (options?.symbol) {
      where.symbol = options.symbol;
    }

    if (options?.tradeType) {
      where.tradeType = options.tradeType;
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.trade.count({ where }),
    ]);

    return { trades, total };
  }

  /**
   * Get trade statistics for a user
   */
  async getTradeStats(userId: string) {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        trades: true,
      },
    });

    const allTrades = portfolios.flatMap((p) => p.trades);

    const totalTrades = allTrades.length;
    const buyTrades = allTrades.filter((t) => t.tradeType === 'BUY').length;
    const sellTrades = allTrades.filter((t) => t.tradeType === 'SELL').length;

    const totalVolume = allTrades.reduce(
      (sum, trade) => sum + trade.totalValue.toNumber(),
      0
    );

    // Get unique symbols traded
    const uniqueSymbols = new Set(allTrades.map((t) => t.symbol));

    return {
      totalTrades,
      buyTrades,
      sellTrades,
      totalVolume,
      uniqueSymbolsTraded: uniqueSymbols.size,
      averageTradeSize: totalTrades > 0 ? totalVolume / totalTrades : 0,
    };
  }
}

export default new TradeService();
