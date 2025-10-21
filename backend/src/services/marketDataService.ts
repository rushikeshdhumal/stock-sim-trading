import axios from 'axios';
import getPrismaClient from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { MarketQuote } from '../types';
import logger from '../config/logger';

const prisma = getPrismaClient();
const CACHE_TTL = parseInt(env.MARKET_DATA_CACHE_TTL);

export class MarketDataService {
  /**
   * Get quote for a symbol (with caching)
   */
  async getQuote(symbol: string): Promise<MarketQuote> {
    const cacheKey = `quote:${symbol}`;

    // Try cache first
    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read error:', error);
    }

    // Try database cache
    const dbCache = await prisma.marketDataCache.findUnique({
      where: { symbol },
    });

    if (dbCache && this.isCacheValid(dbCache.lastUpdated)) {
      const quote = this.formatQuote(dbCache);
      await this.setCacheQuote(cacheKey, quote);
      return quote;
    }

    // Fetch from external API
    const quote = await this.fetchQuoteFromAPI(symbol);

    // Update caches
    await this.updateMarketDataCache(symbol, quote);
    await this.setCacheQuote(cacheKey, quote);

    return quote;
  }

  /**
   * Search for stocks/crypto
   */
  async search(query: string, type: 'stock' | 'crypto' | 'all' = 'all'): Promise<any[]> {
    // First, search in cache
    const results = await prisma.marketDataCache.findMany({
      where: {
        symbol: {
          contains: query.toUpperCase(),
        },
        ...(type !== 'all' && {
          assetType: type.toUpperCase() as 'STOCK' | 'CRYPTO',
        }),
      },
      take: 10,
    });

    // If found in cache, return results
    if (results.length > 0) {
      return results.map((item) => ({
        symbol: item.symbol,
        assetType: item.assetType,
        currentPrice: item.currentPrice?.toNumber(),
        change24h: item.change24h?.toNumber(),
      }));
    }

    // If not found in cache and query looks like a symbol (3-5 uppercase chars), fetch from API
    const symbolPattern = /^[A-Z]{1,5}$/i;
    if (symbolPattern.test(query)) {
      try {
        const quote = await this.getQuote(query.toUpperCase());
        return [{
          symbol: quote.symbol,
          assetType: quote.assetType,
          currentPrice: quote.currentPrice,
          change24h: quote.change24h,
        }];
      } catch (error) {
        logger.warn(`Failed to fetch quote for ${query}:`, error);
        return [];
      }
    }

    return [];
  }

  /**
   * Get trending assets
   */
  async getTrending(): Promise<any[]> {
    const trending = await prisma.marketDataCache.findMany({
      orderBy: { volume: 'desc' },
      take: 10,
      where: {
        volume: { not: null },
      },
    });

    return trending.map((item) => this.formatQuote(item));
  }

  /**
   * Get most traded assets on platform
   */
  async getPopular(): Promise<any[]> {
    const popular = await prisma.trade.groupBy({
      by: ['symbol'],
      _count: {
        symbol: true,
      },
      orderBy: {
        _count: {
          symbol: 'desc',
        },
      },
      take: 10,
    });

    const symbols = popular.map((p) => p.symbol);
    const quotes = await Promise.all(symbols.map((symbol) => this.getQuote(symbol)));

    return quotes;
  }

  /**
   * Fetch quote from external API with fallback chain
   * Priority: Alpha Vantage -> yfinance -> Mock Data
   */
  private async fetchQuoteFromAPI(symbol: string): Promise<MarketQuote> {
    // Try Alpha Vantage first
    if (env.ALPHA_VANTAGE_API_KEY) {
      try {
        return await this.fetchFromAlphaVantage(symbol);
      } catch (error: any) {
        // If rate limited (429) or other error, try yfinance
        logger.warn(`Alpha Vantage failed for ${symbol}, trying yfinance:`, error.message);
      }
    }

    // Try yfinance service
    try {
      return await this.fetchFromYFinance(symbol);
    } catch (error) {
      logger.warn(`yfinance failed for ${symbol}, using mock data:`, error);
    }

    // Fallback to mock data
    logger.warn(`All APIs failed for ${symbol}, returning mock data`);
    return this.getMockQuote(symbol);
  }

  /**
   * Fetch from Alpha Vantage API
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<MarketQuote> {
    const url = `https://www.alphavantage.co/query`;
    const response = await axios.get(url, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: env.ALPHA_VANTAGE_API_KEY,
      },
      timeout: 5000,
    });

    const quote = response.data['Global Quote'];

    if (!quote || !quote['05. price']) {
      throw new AppError('Symbol not found in Alpha Vantage', 404);
    }

    const currentPrice = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

    return {
      symbol: symbol.toUpperCase(),
      assetType: 'STOCK',
      currentPrice,
      change24h: change,
      changePercentage: changePercent,
      volume: parseInt(quote['06. volume']) || undefined,
      lastUpdated: new Date(),
    };
  }

  /**
   * Fetch from yfinance Python microservice
   */
  private async fetchFromYFinance(symbol: string): Promise<MarketQuote> {
    const url = `http://localhost:5001/quote/${symbol}`;
    const response = await axios.get(url, { timeout: 5000 });

    if (response.status !== 200 || !response.data) {
      throw new Error('Symbol not found in yfinance');
    }

    const data = response.data;

    return {
      symbol: data.symbol,
      assetType: data.assetType || 'STOCK',
      currentPrice: data.currentPrice,
      change24h: data.change24h,
      changePercentage: data.changePercentage,
      volume: data.volume || undefined,
      marketCap: data.marketCap || undefined,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get mock quote for development
   */
  private getMockQuote(symbol: string): MarketQuote {
    const mockPrices: { [key: string]: number } = {
      AAPL: 178.25,
      GOOGL: 142.5,
      MSFT: 385.0,
      TSLA: 242.5,
      AMZN: 152.75,
      BTC: 43250.0,
      ETH: 2280.0,
    };

    const price = mockPrices[symbol] || 100.0;
    const change = (Math.random() - 0.5) * 10;

    return {
      symbol: symbol.toUpperCase(),
      assetType: ['BTC', 'ETH'].includes(symbol) ? 'CRYPTO' : 'STOCK',
      currentPrice: price,
      change24h: change,
      changePercentage: (change / price) * 100,
      volume: Math.floor(Math.random() * 100000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      lastUpdated: new Date(),
    };
  }

  /**
   * Update market data cache in database
   */
  private async updateMarketDataCache(symbol: string, quote: MarketQuote): Promise<void> {
    await prisma.marketDataCache.upsert({
      where: { symbol },
      create: {
        symbol,
        assetType: quote.assetType as 'STOCK' | 'CRYPTO',
        currentPrice: quote.currentPrice,
        change24h: quote.change24h,
        volume: quote.volume ? BigInt(quote.volume) : null,
        marketCap: quote.marketCap ? BigInt(quote.marketCap) : null,
        lastUpdated: new Date(),
      },
      update: {
        currentPrice: quote.currentPrice,
        change24h: quote.change24h,
        volume: quote.volume ? BigInt(quote.volume) : null,
        marketCap: quote.marketCap ? BigInt(quote.marketCap) : null,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * Set quote in cache
   */
  private async setCacheQuote(key: string, quote: MarketQuote): Promise<void> {
    try {
      await cacheSet(key, JSON.stringify(quote), CACHE_TTL);
    } catch (error) {
      logger.warn('Cache write error:', error);
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastUpdated: Date): boolean {
    const now = new Date();
    const diffSeconds = (now.getTime() - lastUpdated.getTime()) / 1000;
    return diffSeconds < CACHE_TTL;
  }

  /**
   * Format database cache to MarketQuote
   */
  private formatQuote(data: any): MarketQuote {
    return {
      symbol: data.symbol,
      assetType: data.assetType,
      currentPrice: data.currentPrice?.toNumber() || 0,
      change24h: data.change24h?.toNumber() || 0,
      changePercentage: data.currentPrice
        ? ((data.change24h?.toNumber() || 0) / data.currentPrice.toNumber()) * 100
        : 0,
      volume: data.volume ? Number(data.volume) : undefined,
      marketCap: data.marketCap ? Number(data.marketCap) : undefined,
      lastUpdated: data.lastUpdated,
    };
  }
}

export default new MarketDataService();
