import { Request, Response } from 'express';
import * as watchlistService from '../services/watchlistService';
import logger from '../config/logger';
import { AssetType } from '@prisma/client';

export const getWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const watchlist = await watchlistService.getUserWatchlist(userId);

    res.json({
      success: true,
      data: watchlist,
    });
  } catch (error) {
    logger.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

export const addToWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { symbol, assetType, notes } = req.body;

    const item = await watchlistService.addToWatchlist(
      userId,
      symbol,
      assetType as AssetType,
      notes
    );

    res.status(201).json({
      success: true,
      data: item,
      message: 'Added to watchlist',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Symbol already in watchlist' });
      return;
    }
    logger.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

export const removeFromWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await watchlistService.removeFromWatchlist(userId, id);

    res.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    logger.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

export const removeFromWatchlistBySymbol = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { symbol } = req.params;

    await watchlistService.removeFromWatchlistBySymbol(userId, symbol);

    res.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    logger.error('Error removing from watchlist by symbol:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

export const checkWatchlistStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { symbol } = req.params;

    const inWatchlist = await watchlistService.isInWatchlist(userId, symbol);

    res.json({
      success: true,
      data: { inWatchlist },
    });
  } catch (error) {
    logger.error('Error checking watchlist status:', error);
    res.status(500).json({ error: 'Failed to check watchlist status' });
  }
};

export const checkBatchWatchlistStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ error: 'symbols must be a non-empty array' });
      return;
    }

    const statusMap = await watchlistService.checkBatchWatchlistStatus(userId, symbols);

    // Convert Map to object for JSON response
    const statusObject: Record<string, boolean> = {};
    statusMap.forEach((value, key) => {
      statusObject[key] = value;
    });

    res.json({
      success: true,
      data: statusObject,
    });
  } catch (error) {
    logger.error('Error checking batch watchlist status:', error);
    res.status(500).json({ error: 'Failed to check watchlist status' });
  }
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  removeFromWatchlistBySymbol,
  checkWatchlistStatus,
  checkBatchWatchlistStatus,
};
