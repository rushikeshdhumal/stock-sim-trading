import { Request, Response } from 'express';
import portfolioService from '../services/portfolioService';
import { successResponse } from '../utils/responseHelper';
import asyncHandler from '../utils/asyncHandler';

export class PortfolioController {
  /**
   * Get all portfolios for the authenticated user
   * GET /api/portfolios
   */
  getPortfolios = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const portfolios = await portfolioService.getUserPortfolios(userId);

    successResponse(res, portfolios);
  });

  /**
   * Get portfolio by ID with holdings
   * GET /api/portfolios/:id
   */
  getPortfolioById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const portfolio = await portfolioService.getPortfolioById(id, userId);

    successResponse(res, portfolio);
  });

  /**
   * Create a new portfolio
   * POST /api/portfolios
   */
  createPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, initialBalance } = req.body;

    const portfolio = await portfolioService.createPortfolio(userId, name, initialBalance);

    successResponse(res, portfolio, 'Portfolio created successfully', 201);
  });

  /**
   * Calculate current portfolio value
   * GET /api/portfolios/:id/value
   */
  getPortfolioValue = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const value = await portfolioService.calculatePortfolioValue(id, userId);

    successResponse(res, { portfolioId: id, totalValue: value });
  });

  /**
   * Get portfolio performance metrics
   * GET /api/portfolios/:id/performance
   */
  getPortfolioPerformance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const performance = await portfolioService.getPortfolioPerformance(id, userId);

    successResponse(res, performance);
  });
}

export default new PortfolioController();
