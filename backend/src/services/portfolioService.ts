import { Portfolio } from '@prisma/client';
import getPrismaClient from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { PortfolioWithHoldings } from '../types';
import logger from '../config/logger';
import marketDataService from './marketDataService';

const prisma = getPrismaClient();

export class PortfolioService {
  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get portfolio by ID with holdings
   */
  async getPortfolioById(portfolioId: string, userId: string): Promise<PortfolioWithHoldings> {
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

    // Enrich holdings with current market data using batch API
    const symbols = portfolio.holdings.map((h) => h.symbol);
    const marketDataMap = await marketDataService.getQuoteBatch(symbols);

    const enrichedHoldings = portfolio.holdings.map((holding) => {
      const marketData = marketDataMap.get(holding.symbol);

      if (marketData) {
        const currentValue = marketData.currentPrice * holding.quantity.toNumber();
        const costBasis = holding.averageCost.toNumber() * holding.quantity.toNumber();
        const profitLoss = currentValue - costBasis;
        const profitLossPercentage = (profitLoss / costBasis) * 100;

        return {
          id: holding.id,
          symbol: holding.symbol,
          assetType: holding.assetType,
          quantity: holding.quantity.toNumber(),
          averageCost: holding.averageCost.toNumber(),
          currentPrice: marketData.currentPrice,
          currentValue,
          profitLoss,
          profitLossPercentage,
        };
      } else {
        logger.warn(`Failed to get market data for ${holding.symbol}`);
        return {
          id: holding.id,
          symbol: holding.symbol,
          assetType: holding.assetType,
          quantity: holding.quantity.toNumber(),
          averageCost: holding.averageCost.toNumber(),
        };
      }
    });

    return {
      id: portfolio.id,
      userId: portfolio.userId,
      name: portfolio.name,
      cashBalance: portfolio.cashBalance.toNumber(),
      totalValue: portfolio.totalValue?.toNumber() || 0,
      holdings: enrichedHoldings,
      createdAt: portfolio.createdAt,
    };
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(userId: string, name: string, initialBalance?: number): Promise<Portfolio> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const balance = initialBalance || user.startingBalance.toNumber();

    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name,
        cashBalance: balance,
        totalValue: balance,
        isActive: true,
      },
    });

    logger.info(`Portfolio created: ${portfolio.id} for user ${userId}`);

    return portfolio;
  }

  /**
   * Calculate current portfolio value
   */
  async calculatePortfolioValue(portfolioId: string, userId: string): Promise<number> {
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

    let totalHoldingsValue = 0;

    // Calculate value of all holdings using batch API
    const symbols = portfolio.holdings.map((h) => h.symbol);
    const marketDataMap = await marketDataService.getQuoteBatch(symbols);

    for (const holding of portfolio.holdings) {
      const marketData = marketDataMap.get(holding.symbol);

      if (marketData) {
        totalHoldingsValue += marketData.currentPrice * holding.quantity.toNumber();
      } else {
        logger.warn(`Failed to get price for ${holding.symbol}, using average cost`);
        totalHoldingsValue += holding.averageCost.toNumber() * holding.quantity.toNumber();
      }
    }

    const totalValue = portfolio.cashBalance.toNumber() + totalHoldingsValue;

    // Update portfolio total value
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { totalValue },
    });

    return totalValue;
  }

  /**
   * Get portfolio performance metrics
   */
  async getPortfolioPerformance(portfolioId: string, userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
      include: {
        holdings: true,
        trades: {
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const currentValue = await this.calculatePortfolioValue(portfolioId, userId);
    const initialValue = 100000; // Default starting balance
    const totalReturn = currentValue - initialValue;
    const totalReturnPercentage = (totalReturn / initialValue) * 100;

    // Calculate total invested (sum of all buy trades)
    const totalInvested = portfolio.trades
      .filter((trade) => trade.tradeType === 'BUY')
      .reduce((sum, trade) => sum + trade.totalValue.toNumber(), 0);

    return {
      portfolioId: portfolio.id,
      currentValue,
      cashBalance: portfolio.cashBalance.toNumber(),
      totalReturn,
      totalReturnPercentage,
      totalInvested,
      totalTrades: portfolio.trades.length,
      holdingsCount: portfolio.holdings.length,
    };
  }

  /**
   * Update holding after trade
   */
  async updateHolding(
    portfolioId: string,
    symbol: string,
    assetType: 'STOCK' | 'CRYPTO',
    quantity: number,
    price: number,
    tradeType: 'BUY' | 'SELL'
  ): Promise<void> {
    const existingHolding = await prisma.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId,
          symbol,
        },
      },
    });

    if (tradeType === 'BUY') {
      if (existingHolding) {
        // Update existing holding
        const totalQuantity = existingHolding.quantity.toNumber() + quantity;
        const totalCost =
          existingHolding.averageCost.toNumber() * existingHolding.quantity.toNumber() +
          price * quantity;
        const newAverageCost = totalCost / totalQuantity;

        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: totalQuantity,
            averageCost: newAverageCost,
          },
        });
      } else {
        // Create new holding
        await prisma.holding.create({
          data: {
            portfolioId,
            symbol,
            assetType,
            quantity,
            averageCost: price,
          },
        });
      }
    } else {
      // SELL
      if (!existingHolding) {
        throw new AppError('No holding found to sell', 400);
      }

      const newQuantity = existingHolding.quantity.toNumber() - quantity;

      if (newQuantity < 0) {
        throw new AppError('Insufficient holdings to sell', 400);
      }

      if (newQuantity === 0) {
        // Delete holding if quantity is zero
        await prisma.holding.delete({
          where: { id: existingHolding.id },
        });
      } else {
        // Update quantity
        await prisma.holding.update({
          where: { id: existingHolding.id },
          data: { quantity: newQuantity },
        });
      }
    }
  }
}

export default new PortfolioService();
