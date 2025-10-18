import { Request, Response } from 'express';
import marketDataService from '../services/marketDataService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';

export class MarketController {
  /**
   * Search for stocks/crypto
   * GET /api/market/search
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const { q, type } = req.query;

    const results = await marketDataService.search(
      q as string,
      (type as 'stock' | 'crypto' | 'all') || 'all'
    );

    successResponse(res, results);
  });

  /**
   * Get quote for a symbol
   * GET /api/market/quote/:symbol
   */
  getQuote = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params;

    const quote = await marketDataService.getQuote(symbol.toUpperCase());

    successResponse(res, quote);
  });

  /**
   * Get trending stocks/crypto
   * GET /api/market/trending
   */
  getTrending = asyncHandler(async (_req: Request, res: Response) => {
    const trending = await marketDataService.getTrending();

    successResponse(res, trending);
  });

  /**
   * Get most traded assets on platform
   * GET /api/market/popular
   */
  getPopular = asyncHandler(async (_req: Request, res: Response) => {
    const popular = await marketDataService.getPopular();

    successResponse(res, popular);
  });
}

export default new MarketController();
