import axios from 'axios';
import getPrismaClient from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { MarketQuote } from '../types';
import logger from '../config/logger';
import { alphaVantageQueue, yfinanceQueue, finnhubQueue } from '../utils/requestQueue';

const prisma = getPrismaClient();
const CACHE_TTL = parseInt(env.MARKET_DATA_CACHE_TTL);

// API Response Type Definitions
interface YFinanceBatchQuote {
  symbol?: string;
  assetType?: string;
  currentPrice: number;
  change24h: number;
  changePercentage: number;
  volume?: number;
  marketCap?: number;
}

interface YFinanceBatchResponse {
  [symbol: string]: YFinanceBatchQuote;
}

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
   * Get quotes for multiple symbols (batch operation)
   * Significantly faster than calling getQuote multiple times
   */
  async getQuoteBatch(symbols: string[]): Promise<Map<string, MarketQuote>> {
    if (symbols.length === 0) {
      return new Map();
    }

    const results = new Map<string, MarketQuote>();
    const uncachedSymbols: string[] = [];
    const symbolsToCheckDb: string[] = [];

    // Step 1: Check Redis cache for all symbols
    for (const symbol of symbols) {
      const cacheKey = `quote:${symbol}`;

      try {
        const cached = await cacheGet(cacheKey);
        if (cached) {
          results.set(symbol, JSON.parse(cached));
        } else {
          // Not in Redis, need to check database
          symbolsToCheckDb.push(symbol);
        }
      } catch (error) {
        logger.warn(`Redis cache error for ${symbol}:`, error);
        symbolsToCheckDb.push(symbol);
      }
    }

    // Step 2: Batch query database for symbols not in Redis
    if (symbolsToCheckDb.length > 0) {
      try {
        // Single batch query instead of N individual queries
        const dbCaches = await prisma.marketDataCache.findMany({
          where: {
            symbol: {
              in: symbolsToCheckDb,
            },
          },
        });

        // Process database results
        const dbCacheMap = new Map(dbCaches.map(cache => [cache.symbol, cache]));

        for (const symbol of symbolsToCheckDb) {
          const dbCache = dbCacheMap.get(symbol);

          if (dbCache && this.isCacheValid(dbCache.lastUpdated)) {
            const quote = this.formatQuote(dbCache);
            results.set(symbol, quote);
            // Backfill Redis cache
            await this.setCacheQuote(`quote:${symbol}`, quote);
          } else {
            // Symbol not in cache or cache expired, needs API fetch
            uncachedSymbols.push(symbol);
          }
        }
      } catch (error) {
        logger.error('Database batch query failed:', error);
        // On error, treat all symbolsToCheckDb as uncached
        uncachedSymbols.push(...symbolsToCheckDb);
      }
    }

    // If all symbols were cached, return early
    if (uncachedSymbols.length === 0) {
      logger.info(`Batch request: All ${symbols.length} symbols served from cache`);
      return results;
    }

    logger.info(`Batch request: ${results.size} from cache, ${uncachedSymbols.length} need API fetch`);

    // Fetch uncached symbols from API (batch operation)
    try {
      const batchQuotes = await this.fetchQuoteBatchFromAPI(uncachedSymbols);

      // Update caches and add to results
      for (const [symbol, quote] of batchQuotes.entries()) {
        results.set(symbol, quote);
        await this.updateMarketDataCache(symbol, quote);
        await this.setCacheQuote(`quote:${symbol}`, quote);
      }
    } catch (error) {
      logger.error('Batch API fetch failed:', error);
      // Fall back to individual fetches for uncached symbols
      logger.info('Falling back to individual fetches...');
      for (const symbol of uncachedSymbols) {
        try {
          const quote = await this.fetchQuoteFromAPI(symbol);
          results.set(symbol, quote);
          await this.updateMarketDataCache(symbol, quote);
          await this.setCacheQuote(`quote:${symbol}`, quote);
        } catch (err) {
          logger.error(`Failed to fetch ${symbol}:`, err);
        }
      }
    }

    return results;
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

    // Use batch API for better performance
    const quotesMap = await this.getQuoteBatch(symbols);

    // Convert Map to Array, maintaining order
    const quotes = symbols
      .map((symbol) => quotesMap.get(symbol))
      .filter((quote): quote is MarketQuote => quote !== undefined);

    return quotes;
  }

  /**
   * Fetch quote from external API with fallback chain
   * Priority: Alpha Vantage -> yfinance -> Finnhub
   * Uses request queues to prevent rate limiting
   */
  private async fetchQuoteFromAPI(symbol: string): Promise<MarketQuote> {
    let quote: MarketQuote | null = null;

    // Try Alpha Vantage first (Primary)
    if (env.ALPHA_VANTAGE_API_KEY) {
      try {
        quote = await alphaVantageQueue.add(() => this.fetchFromAlphaVantage(symbol));
        if (quote) return quote;
      } catch (error: any) {
        logger.warn(`Alpha Vantage failed for ${symbol}:`, error.message);
      }
    }

    // Try yfinance service (Secondary)
    try {
      quote = await yfinanceQueue.add(() => this.fetchFromYFinance(symbol));
      if (quote) return quote;
    } catch (error: any) {
      logger.warn(`yfinance failed for ${symbol}:`, error.message);
    }

    // Try Finnhub (Tertiary)
    if (env.FINNHUB_API_KEY) {
      try {
        quote = await finnhubQueue.add(() => this.fetchFromFinnhub(symbol));
        if (quote) return quote;
      } catch (error: any) {
        logger.warn(`Finnhub failed for ${symbol}:`, error.message);
      }
    }

    // If all APIs failed, throw error
    throw new AppError(`Unable to fetch quote for ${symbol} from any API`, 503);
  }

  /**
   * Fetch quotes for multiple symbols from API (batch operation)
   * Priority: Alpha Vantage -> Finnhub parallel -> yfinance batch
   */
  private async fetchQuoteBatchFromAPI(symbols: string[]): Promise<Map<string, MarketQuote>> {
    let quotes: Map<string, MarketQuote>;

    // Try Alpha Vantage batch API first (Primary)
    if (env.ALPHA_VANTAGE_API_KEY && symbols.length > 0) {
      try {
        quotes = await alphaVantageQueue.add(() => this.fetchBatchFromAlphaVantage(symbols));
        if (quotes.size > 0) {
          logger.info(`Alpha Vantage batch: Successfully fetched ${quotes.size}/${symbols.length} symbols`);
          return quotes;
        }
      } catch (error: any) {
        logger.warn(`Alpha Vantage batch failed:`, error.message);
      }
    }

    // Try Finnhub parallel fetches (Tertiary - faster than sequential)
    if (env.FINNHUB_API_KEY && symbols.length > 0) {
      try {
        quotes = await this.fetchBatchFromFinnhub(symbols);
        if (quotes.size > 0) {
          logger.info(`Finnhub batch: Successfully fetched ${quotes.size}/${symbols.length} symbols`);
          return quotes;
        }
      } catch (error: any) {
        logger.warn(`Finnhub batch failed:`, error.message);
      }
    }

    // Fallback: Try yfinance if available
    try {
      quotes = await this.fetchBatchFromYFinance(symbols);
      if (quotes.size > 0) {
        logger.info(`yfinance batch: Successfully fetched ${quotes.size}/${symbols.length} symbols`);
        return quotes;
      }
    } catch (error: any) {
      logger.warn(`yfinance batch failed:`, error.message);
    }

    throw new AppError(`Unable to fetch batch quotes for ${symbols.length} symbols from any API`, 503);
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
   * Fetch from Finnhub API
   */
  private async fetchFromFinnhub(symbol: string): Promise<MarketQuote> {
    const url = `https://finnhub.io/api/v1/quote`;
    const response = await axios.get(url, {
      params: {
        symbol: symbol.toUpperCase(),
        token: env.FINNHUB_API_KEY,
      },
      timeout: 5000,
    });

    const data = response.data;

    if (!data || !data.c) {
      throw new AppError('Symbol not found in Finnhub', 404);
    }

    return {
      symbol: symbol.toUpperCase(),
      assetType: 'STOCK',
      currentPrice: data.c,
      change24h: data.d,
      changePercentage: data.dp,
      volume: undefined,
      marketCap: undefined,
      lastUpdated: new Date(),
    };
  }

  /**
   * Fetch batch quotes from Alpha Vantage
   * Uses BATCH_STOCK_QUOTES endpoint (up to 100 symbols)
   */
  private async fetchBatchFromAlphaVantage(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const quotes = new Map<string, MarketQuote>();
    const failedSymbols: string[] = [];
    const missingDataSymbols: string[] = [];

    // Alpha Vantage free API only supports individual GLOBAL_QUOTE requests
    const symbolsToFetch = symbols.slice(0, 100);
    for (const symbol of symbolsToFetch) {
      try {
        const url = `https://www.alphavantage.co/query`;
        const response = await axios.get(url, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol.toUpperCase(),
            apikey: env.ALPHA_VANTAGE_API_KEY,
          },
          timeout: 10000,
        });
        const quoteData = response.data['Global Quote'];
        if (!quoteData || !quoteData['01. symbol'] || !quoteData['05. price']) {
          missingDataSymbols.push(symbol);
          continue; // skip if data is missing
        }
        quotes.set(symbol.toUpperCase(), {
          symbol: quoteData['01. symbol'],
          assetType: 'STOCK',
          currentPrice: parseFloat(quoteData['05. price']),
          change24h: parseFloat(quoteData['09. change']) || 0,
          changePercentage: parseFloat(quoteData['10. change percent']) || 0,
          volume: parseInt(quoteData['06. volume']) || undefined,
          lastUpdated: new Date(),
        });
      } catch (err: any) {
        failedSymbols.push(symbol);
        logger.warn(`Alpha Vantage GLOBAL_QUOTE failed for symbol ${symbol}: ${err.message || err}`);
        continue;
      }
    }

    // Log summary of batch results
    if (failedSymbols.length > 0) {
      logger.warn(`Alpha Vantage batch: ${failedSymbols.length} symbols failed with errors: ${failedSymbols.join(', ')}`);
    }
    if (missingDataSymbols.length > 0) {
      logger.warn(`Alpha Vantage batch: ${missingDataSymbols.length} symbols returned no data (possibly invalid): ${missingDataSymbols.join(', ')}`);
    }

    return quotes;
  }

  /**
   * Fetch batch quotes from Finnhub
   * Makes parallel requests with rate limiting (60 req/min)
   */
  private async fetchBatchFromFinnhub(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const quotes = new Map<string, MarketQuote>();
    const failedSymbols: string[] = [];

    // Fetch in parallel but respect rate limit
    const promises = symbols.map((symbol) =>
      finnhubQueue.add(() => this.fetchFromFinnhub(symbol))
        .then((quote) => quotes.set(symbol, quote))
        .catch((error) => {
          failedSymbols.push(symbol);
          logger.warn(`Finnhub failed for ${symbol}:`, error.message);
        })
    );

    await Promise.all(promises);

    // Log summary of batch results
    if (failedSymbols.length > 0) {
      logger.warn(`Finnhub batch: ${failedSymbols.length}/${symbols.length} symbols failed: ${failedSymbols.join(', ')}`);
    }

    return quotes;
  }

  /**
   * Fetch batch quotes from yfinance
   * The Python microservice should support batch fetching
   */
  private async fetchBatchFromYFinance(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const quotes = new Map<string, MarketQuote>();
    const failedSymbols: string[] = [];

    // Try batch endpoint if available
    try {
      const url = `http://localhost:5001/quotes/batch`;
      const response = await axios.post<YFinanceBatchResponse>(url, { symbols }, { timeout: 10000 });

      if (response.status === 200 && response.data) {
        const successCount = Object.keys(response.data).length;
        for (const [symbol, quoteData] of Object.entries(response.data)) {
          quotes.set(symbol, {
            symbol: quoteData.symbol || symbol,
            assetType: quoteData.assetType || 'STOCK',
            currentPrice: quoteData.currentPrice,
            change24h: quoteData.change24h,
            changePercentage: quoteData.changePercentage,
            volume: quoteData.volume || undefined,
            marketCap: quoteData.marketCap || undefined,
            lastUpdated: new Date(),
          });
        }

        // Log which symbols failed in batch response
        if (successCount < symbols.length) {
          const receivedSymbols = Object.keys(response.data);
          const missingSymbols = symbols.filter(s => !receivedSymbols.includes(s));
          logger.warn(`yfinance batch: ${missingSymbols.length}/${symbols.length} symbols returned no data: ${missingSymbols.join(', ')}`);
        }

        return quotes;
      }
    } catch (error) {
      logger.warn('yfinance batch endpoint not available, falling back to individual requests');
    }

    // Fallback: fetch individually
    const promises = symbols.map((symbol) =>
      yfinanceQueue.add(() => this.fetchFromYFinance(symbol))
        .then((quote) => quotes.set(symbol, quote))
        .catch((error) => {
          failedSymbols.push(symbol);
          logger.warn(`yfinance failed for ${symbol}:`, error.message);
        })
    );

    await Promise.all(promises);

    // Log summary for individual fallback
    if (failedSymbols.length > 0) {
      logger.warn(`yfinance batch (individual fallback): ${failedSymbols.length}/${symbols.length} symbols failed: ${failedSymbols.join(', ')}`);
    }

    return quotes;
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
