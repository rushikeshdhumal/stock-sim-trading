import getPrismaClient from '../config/database';
import { AssetType } from '@prisma/client';
import marketDataService from './marketDataService';
import logger from '../config/logger';
import { WatchlistItem } from '../types';

const prisma = getPrismaClient();

/**
 * Get user's watchlist with current market data
 * Uses batch API for optimal performance
 */
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const watchlistItems = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
  });

  if (watchlistItems.length === 0) {
    return [];
  }

  // Extract symbols for batch fetching
  const symbols = watchlistItems.map((item) => item.symbol);

  // Use batch API to fetch all quotes at once (much faster!)
  const quotesMap = await marketDataService.getQuoteBatch(symbols);

  // Enrich watchlist items with current market data
  const enrichedItems: WatchlistItem[] = watchlistItems.map((item) => {
    const quote = quotesMap.get(item.symbol);

    if (quote) {
      return {
        id: item.id,
        symbol: item.symbol,
        assetType: item.assetType,
        notes: item.notes || undefined,
        addedAt: item.addedAt,
        currentPrice: quote.currentPrice,
        change24h: quote.change24h,
        changePercentage: quote.changePercentage,
      };
    } else {
      // Return without price data if quote fetch failed
      logger.warn(`Failed to get quote for ${item.symbol} in watchlist`);
      return {
        id: item.id,
        symbol: item.symbol,
        assetType: item.assetType,
        notes: item.notes || undefined,
        addedAt: item.addedAt,
      };
    }
  });

  return enrichedItems;
}

/**
 * Add a symbol to user's watchlist
 */
export async function addToWatchlist(
  userId: string,
  symbol: string,
  assetType: AssetType,
  notes?: string
) {
  return await prisma.watchlist.create({
    data: {
      userId,
      symbol: symbol.toUpperCase(),
      assetType,
      notes: notes || null,
    },
  });
}

/**
 * Remove a symbol from user's watchlist
 */
export async function removeFromWatchlist(userId: string, watchlistId: string) {
  return await prisma.watchlist.delete({
    where: {
      id: watchlistId,
      userId, // Ensure user owns this watchlist item
    },
  });
}

/**
 * Check if a symbol is in user's watchlist
 */
export async function isInWatchlist(userId: string, symbol: string): Promise<boolean> {
  const item = await prisma.watchlist.findUnique({
    where: {
      userId_symbol: {
        userId,
        symbol: symbol.toUpperCase(),
      },
    },
  });
  return !!item;
}

/**
 * Get watchlist item by symbol (for removal by symbol instead of ID)
 */
export async function getWatchlistItemBySymbol(userId: string, symbol: string) {
  return await prisma.watchlist.findUnique({
    where: {
      userId_symbol: {
        userId,
        symbol: symbol.toUpperCase(),
      },
    },
  });
}

/**
 * Remove a symbol from user's watchlist by symbol (more efficient than by ID)
 */
export async function removeFromWatchlistBySymbol(userId: string, symbol: string) {
  return await prisma.watchlist.delete({
    where: {
      userId_symbol: {
        userId,
        symbol: symbol.toUpperCase(),
      },
    },
  });
}
