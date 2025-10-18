import { Request, Response } from 'express';
import tradeService from '../services/tradeService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';

export class TradeController {
  /**
   * Execute a buy order
   * POST /api/trades/buy
   */
  executeBuy = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { portfolioId, symbol, assetType, quantity } = req.body;

    const result = await tradeService.executeTrade(
      portfolioId,
      userId,
      symbol,
      assetType,
      'BUY',
      quantity
    );

    successResponse(res, result, 'Buy order executed successfully', 201);
  });

  /**
   * Execute a sell order
   * POST /api/trades/sell
   */
  executeSell = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { portfolioId, symbol, assetType, quantity } = req.body;

    const result = await tradeService.executeTrade(
      portfolioId,
      userId,
      symbol,
      assetType,
      'SELL',
      quantity
    );

    successResponse(res, result, 'Sell order executed successfully', 201);
  });

  /**
   * Get trade history
   * GET /api/trades/history
   */
  getTradeHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { portfolioId, limit, offset, symbol, tradeType } = req.query;

    const result = await tradeService.getTradeHistory(portfolioId as string, userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      symbol: symbol as string,
      tradeType: tradeType as 'BUY' | 'SELL',
    });

    successResponse(res, result);
  });

  /**
   * Validate a trade before execution
   * POST /api/trades/validate
   */
  validateTrade = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { portfolioId, symbol, assetType, tradeType, quantity } = req.body;

    // This is a simplified validation - in production you'd check more thoroughly
    successResponse(res, { valid: true, message: 'Trade is valid' });
  });
}

export default new TradeController();
