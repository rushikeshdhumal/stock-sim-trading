# Team Project Plan - Next Phase Development

**Team Size**: 3 developers
**Workflow**: Feature branches → Pull Requests → Dev branch
**Duration**: Estimated 2-3 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Git Workflow](#git-workflow)
3. [Person 1: Rate Limiting & API Optimization](#person-1-rate-limiting--api-optimization)
4. [Person 2: Watchlist Feature](#person-2-watchlist-feature)
5. [Person 3: Advanced Trading & Charts](#person-3-advanced-trading--charts)
6. [Testing Requirements](#testing-requirements)
7. [Pull Request Guidelines](#pull-request-guidelines)

---

## Overview

### Features to Implement

1. **Rate Limiting & API Optimization** (Person 1)
   - Remove mock data fallback
   - Multi-API priority system
   - Request throttling/queueing
   - Cache optimization

2. **Watchlist Feature** (Person 2)
   - Save favorite assets
   - Monitor watchlist with real-time prices
   - Add/remove functionality
   - Watchlist page UI

3. **Advanced Trading & Charts** (Person 3)
   - After-market orders
   - Limit orders
   - Short selling
   - Historical charts with candlesticks

---

## Git Workflow

### Initial Setup

```bash
# Ensure you're on dev branch
git checkout dev
git pull origin dev

# Create your feature branch
# Person 1:
git checkout -b feature/rate-limiting

# Person 2:
git checkout -b feature/watchlist

# Person 3:
git checkout -b feature/advanced-trading
```

### Development Cycle

```bash
# Regularly commit your work
git add .
git commit -m "feat: description of change"

# Pull latest changes from dev periodically
git checkout dev
git pull origin dev
git checkout feature/your-branch
git merge dev

# Push your branch
git push origin feature/your-branch
```

### Creating Pull Requests

```bash
# When feature is complete
git push origin feature/your-branch

# Create PR on GitHub/GitLab:
# - Base: dev
# - Compare: feature/your-branch
# - Add description, screenshots, testing notes
# - Request reviews from team members
```

---

## Person 1: Rate Limiting & API Optimization

**Branch**: `feature/rate-limiting`
**Estimated Time**: 5-7 days

### Tasks Breakdown

#### Phase 1: Setup & Configuration (Day 1)

**Task 1.1**: Create feature branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/rate-limiting
```

**Task 1.2**: Add Finnhub API configuration
- File: `backend/.env`
```env
FINNHUB_API_KEY="your-finnhub-api-key"
```

- File: `backend/src/config/env.ts`
```typescript
FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || '',
```

**Task 1.3**: Update cache TTL
- File: `backend/.env`
```env
MARKET_DATA_CACHE_TTL="1800"  # Change from 300 to 1800 (30 minutes)
```

#### Phase 2: Request Queue Implementation (Day 2-3)

**Task 1.4**: Create request queue utility
- File: `backend/src/utils/requestQueue.ts`

```typescript
export class RequestQueue {
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs: number = 1000) {
    this.delayMs = delayMs;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const item = this.queue.shift()!;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    await this.delay(this.delayMs);
    this.processing = false;
    this.processQueue();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instances for each API
export const alphaVantageQueue = new RequestQueue(12000); // 12 sec (5 req/min)
export const yfinanceQueue = new RequestQueue(1000);      // 1 sec
export const finnhubQueue = new RequestQueue(1000);       // 1 sec (60 req/min)
```

#### Phase 3: Multi-API Implementation (Day 3-4)

**Task 1.5**: Remove mock data fallback
- File: `backend/src/services/marketDataService.ts`
- Remove all references to `getMockQuote()` function

**Task 1.6**: Implement Finnhub integration
- File: `backend/src/services/marketDataService.ts`

Add Finnhub fetch function:
```typescript
async function fetchFromFinnhub(symbol: string): Promise<MarketQuote | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${env.FINNHUB_API_KEY}`
    );
    const data = await response.json();

    if (data.c) {
      return {
        symbol,
        assetType: 'STOCK',
        currentPrice: data.c,
        change24h: data.d,
        changePercentage: data.dp,
        volume: null,
        marketCap: null,
        lastUpdated: new Date(),
      };
    }
    return null;
  } catch (error) {
    logger.error(`Finnhub API error for ${symbol}:`, error);
    return null;
  }
}
```

**Task 1.7**: Implement API priority system
- File: `backend/src/services/marketDataService.ts`

Update `getQuote()` function:
```typescript
export async function getQuote(symbol: string, assetType: AssetType): Promise<MarketQuote> {
  // 1. Check Redis cache
  const cached = await getCachedQuote(symbol);
  if (cached) return cached;

  // 2. Check database cache
  const dbCached = await getDbCachedQuote(symbol, assetType);
  if (dbCached) {
    await cacheQuote(dbCached);
    return dbCached;
  }

  // 3. Try Alpha Vantage (Primary)
  let quote = await alphaVantageQueue.add(() => fetchFromAlphaVantage(symbol, assetType));

  // 4. Try yfinance (Secondary)
  if (!quote) {
    quote = await yfinanceQueue.add(() => fetchFromYFinance(symbol, assetType));
  }

  // 5. Try Finnhub (Tertiary)
  if (!quote) {
    quote = await finnhubQueue.add(() => fetchFromFinnhub(symbol));
  }

  // 6. Throw error if all APIs failed
  if (!quote) {
    throw new Error(`Unable to fetch quote for ${symbol} from any API`);
  }

  // Cache the result
  await cacheQuote(quote);
  await saveToDatabase(quote);

  return quote;
}
```

#### Phase 4: Background Job Optimization (Day 5)

**Task 1.8**: Optimize scheduled jobs
- File: `backend/src/jobs/scheduledJobs.ts`

```typescript
// Reduce frequency of leaderboard updates during off-hours
cron.schedule('0 */2 * * *', async () => {  // Every 2 hours instead of every hour
  const now = new Date();
  const hour = now.getHours();

  // Only run during market hours (9 AM - 4 PM EST)
  if (hour >= 9 && hour <= 16) {
    await updateLeaderboards();
  }
});

// Add market data cleanup job (remove stale cache entries)
cron.schedule('0 2 * * *', async () => {  // 2 AM daily
  await cleanupStaleMarketData();
});
```

Add cleanup function:
```typescript
async function cleanupStaleMarketData() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.marketDataCache.deleteMany({
    where: {
      lastUpdated: {
        lt: oneDayAgo
      }
    }
  });

  logger.info('Cleaned up stale market data cache');
}
```

#### Phase 5: Testing & Documentation (Day 6-7)

**Task 1.9**: Test API failover
```bash
# Test with invalid Alpha Vantage key
# Verify it falls back to yfinance
# Then Finnhub

# Test rate limiting by making rapid requests
curl -X GET http://localhost:3001/api/market/quote/AAPL -H "Authorization: Bearer <token>"
```

**Task 1.10**: Update documentation
- File: `backend/README.md` or `docs/API_OPTIMIZATION.md`
- Document API priority
- Document rate limits for each API
- Document cache strategy

**Task 1.11**: Create Pull Request
- Title: `feat: Implement comprehensive rate limiting and multi-API fallback`
- Description: Include changes, testing results, performance improvements
- Request reviews from Person 2 and Person 3

### Deliverables

- ✅ Mock data fallback removed
- ✅ Request queue with throttling
- ✅ Alpha Vantage → yfinance → Finnhub priority
- ✅ Cache TTL increased to 30 minutes
- ✅ Optimized background jobs
- ✅ Error handling for all API failures
- ✅ Documentation updated
- ✅ Pull request created

---

## Person 2: Watchlist Feature

**Branch**: `feature/watchlist`
**Estimated Time**: 6-8 days

### Tasks Breakdown

#### Phase 1: Database Schema (Day 1)

**Task 2.1**: Create feature branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/watchlist
```

**Task 2.2**: Add Watchlist model to Prisma schema
- File: `backend/prisma/schema.prisma`

```prisma
model Watchlist {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  symbol    String   @db.VarChar(20)
  assetType AssetType @map("asset_type")
  addedAt   DateTime @default(now()) @map("added_at")
  notes     String?  @db.Text

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, symbol])
  @@index([userId])
  @@map("watchlists")
}

// Add to User model relations:
watchlists    Watchlist[]
```

**Task 2.3**: Generate Prisma client and push schema
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Phase 2: Backend API (Day 2-3)

**Task 2.4**: Create watchlist types
- File: `backend/src/types/index.ts`

```typescript
export const addToWatchlistSchema = z.object({
  body: z.object({
    symbol: z.string().min(1).max(20),
    assetType: z.enum(['STOCK', 'CRYPTO']),
    notes: z.string().optional(),
  }),
});

export const removeFromWatchlistSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: string;
  notes?: string;
  addedAt: Date;
  currentPrice?: number;
  change24h?: number;
  changePercentage?: number;
}
```

**Task 2.5**: Create watchlist service
- File: `backend/src/services/watchlistService.ts`

```typescript
import { PrismaClient, AssetType } from '@prisma/client';
import { getQuote } from './marketDataService';

const prisma = new PrismaClient();

export async function getUserWatchlist(userId: string) {
  const watchlistItems = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
  });

  // Enrich with current prices
  const enrichedItems = await Promise.all(
    watchlistItems.map(async (item) => {
      try {
        const quote = await getQuote(item.symbol, item.assetType);
        return {
          ...item,
          currentPrice: quote.currentPrice,
          change24h: quote.change24h,
          changePercentage: quote.changePercentage,
        };
      } catch (error) {
        return item;
      }
    })
  );

  return enrichedItems;
}

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
      notes,
    },
  });
}

export async function removeFromWatchlist(userId: string, watchlistId: string) {
  return await prisma.watchlist.delete({
    where: {
      id: watchlistId,
      userId, // Ensure user owns this watchlist item
    },
  });
}

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
```

**Task 2.6**: Create watchlist controller
- File: `backend/src/controllers/watchlistController.ts`

```typescript
import { Request, Response } from 'express';
import * as watchlistService from '../services/watchlistService';
import logger from '../config/logger';

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

export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { symbol, assetType, notes } = req.body;

    const item = await watchlistService.addToWatchlist(userId, symbol, assetType, notes);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Added to watchlist',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Symbol already in watchlist' });
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

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
};
```

**Task 2.7**: Create watchlist routes
- File: `backend/src/routes/watchlistRoutes.ts`

```typescript
import { Router } from 'express';
import watchlistController from '../controllers/watchlistController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { addToWatchlistSchema, removeFromWatchlistSchema } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', watchlistController.getWatchlist);
router.post('/', validate(addToWatchlistSchema), watchlistController.addToWatchlist);
router.delete('/:id', validate(removeFromWatchlistSchema), watchlistController.removeFromWatchlist);
router.get('/check/:symbol', watchlistController.checkWatchlistStatus);

export default router;
```

**Task 2.8**: Register watchlist routes
- File: `backend/src/index.ts`

```typescript
import watchlistRoutes from './routes/watchlistRoutes';

// Add with other routes
app.use('/api/watchlist', watchlistRoutes);
```

#### Phase 3: Frontend Implementation (Day 4-6)

**Task 2.9**: Create frontend watchlist service
- File: `frontend/src/services/watchlistService.ts`

```typescript
import api from './api';

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
  notes?: string;
  addedAt: string;
  currentPrice?: number;
  change24h?: number;
  changePercentage?: number;
}

const watchlistService = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await api.get('/watchlist');
    return response.data.data;
  },

  addToWatchlist: async (symbol: string, assetType: 'STOCK' | 'CRYPTO', notes?: string) => {
    const response = await api.post('/watchlist', { symbol, assetType, notes });
    return response.data.data;
  },

  removeFromWatchlist: async (id: string) => {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  checkWatchlistStatus: async (symbol: string): Promise<boolean> => {
    const response = await api.get(`/watchlist/check/${symbol}`);
    return response.data.data.inWatchlist;
  },
};

export default watchlistService;
```

**Task 2.10**: Create Watchlist page component
- File: `frontend/src/pages/Watchlist.tsx`

```typescript
import { useEffect, useState } from 'react';
import watchlistService, { WatchlistItem } from '../services/watchlistService';
import Navigation from '../components/Navigation';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadWatchlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWatchlist = async () => {
    try {
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, symbol: string) => {
    try {
      await watchlistService.removeFromWatchlist(id);
      setWatchlist(watchlist.filter(item => item.id !== id));
      toast.success(`${symbol} removed from watchlist`);
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading watchlist...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your favorite assets with real-time updates
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Your watchlist is empty</p>
            <Link to="/market" className="btn btn-primary">
              Browse Market
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {watchlist.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{item.symbol}</h3>
                      <span className="badge badge-info">{item.assetType}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {item.currentPrice && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${item.currentPrice.toFixed(2)}
                        </div>
                        {item.changePercentage !== undefined && (
                          <div
                            className={`text-sm font-medium ${
                              item.changePercentage >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.changePercentage >= 0 ? '+' : ''}
                            {item.changePercentage.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleRemove(item.id, item.symbol)}
                      className="btn btn-danger text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
```

**Task 2.11**: Add watchlist button to Market page
- File: `frontend/src/pages/Market.tsx`

Add function to check watchlist status and add/remove:
```typescript
const [inWatchlist, setInWatchlist] = useState<Record<string, boolean>>({});

const toggleWatchlist = async (symbol: string, assetType: 'STOCK' | 'CRYPTO') => {
  try {
    if (inWatchlist[symbol]) {
      // Find the watchlist item ID and remove
      await watchlistService.removeFromWatchlist(symbol);
      setInWatchlist({ ...inWatchlist, [symbol]: false });
      toast.success(`${symbol} removed from watchlist`);
    } else {
      await watchlistService.addToWatchlist(symbol, assetType);
      setInWatchlist({ ...inWatchlist, [symbol]: true });
      toast.success(`${symbol} added to watchlist`);
    }
  } catch (error) {
    toast.error('Failed to update watchlist');
  }
};

// Add button in the results display:
<button
  onClick={() => toggleWatchlist(result.symbol, result.assetType)}
  className="btn btn-secondary"
>
  {inWatchlist[result.symbol] ? '★ In Watchlist' : '☆ Add to Watchlist'}
</button>
```

**Task 2.12**: Add Watchlist route and navigation
- File: `frontend/src/App.tsx`

```typescript
import Watchlist from './pages/Watchlist';

// Add route
<Route path="/watchlist" element={<Watchlist />} />
```

- File: `frontend/src/components/Navigation.tsx`

```typescript
<Link to="/watchlist" className={navLinkClass('/watchlist')}>
  Watchlist
</Link>
```

#### Phase 4: Testing & Documentation (Day 7-8)

**Task 2.13**: Test watchlist functionality
```bash
# Test adding to watchlist
curl -X POST http://localhost:3001/api/watchlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","assetType":"STOCK","notes":"Tech giant"}'

# Test getting watchlist
curl -X GET http://localhost:3001/api/watchlist \
  -H "Authorization: Bearer <token>"

# Test removing from watchlist
curl -X DELETE http://localhost:3001/api/watchlist/<id> \
  -H "Authorization: Bearer <token>"
```

**Task 2.14**: Create Pull Request
- Title: `feat: Add watchlist feature for monitoring favorite assets`
- Description: Include screenshots, API endpoints, testing results
- Request reviews from Person 1 and Person 3

### Deliverables

- ✅ Watchlist database model
- ✅ Backend CRUD API endpoints
- ✅ Frontend watchlist page
- ✅ Add/remove from watchlist in Market page
- ✅ Real-time price updates
- ✅ Responsive UI design
- ✅ Error handling
- ✅ Pull request created

---

## Person 3: Advanced Trading & Charts

**Branch**: `feature/advanced-trading`
**Estimated Time**: 8-10 days

### Tasks Breakdown

#### Phase 1: Database Schema Updates (Day 1-2)

**Task 3.1**: Create feature branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/advanced-trading
```

**Task 3.2**: Update Prisma schema for advanced trading
- File: `backend/prisma/schema.prisma`

```prisma
// Update Trade model
model Trade {
  id          String    @id @default(uuid())
  portfolioId String    @map("portfolio_id")
  symbol      String    @db.VarChar(20)
  assetType   AssetType @map("asset_type")
  tradeType   TradeType @map("trade_type")
  orderType   OrderType @default(MARKET) @map("order_type")  // NEW
  quantity    Decimal   @db.Decimal(18, 8)
  price       Decimal   @db.Decimal(15, 4)
  totalValue  Decimal   @map("total_value") @db.Decimal(15, 2)
  executedAt  DateTime  @default(now()) @map("executed_at")

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
  @@index([executedAt])
  @@index([symbol])
  @@map("trades")
}

// Add new PendingOrder model
model PendingOrder {
  id          String      @id @default(uuid())
  portfolioId String      @map("portfolio_id")
  symbol      String      @db.VarChar(20)
  assetType   AssetType   @map("asset_type")
  tradeType   TradeType   @map("trade_type")
  orderType   OrderType   @map("order_type")
  quantity    Decimal     @db.Decimal(18, 8)
  limitPrice  Decimal?    @map("limit_price") @db.Decimal(15, 4)
  status      OrderStatus @default(PENDING)
  createdAt   DateTime    @default(now()) @map("created_at")
  expiresAt   DateTime?   @map("expires_at")
  executedAt  DateTime?   @map("executed_at")

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
  @@index([status])
  @@index([symbol])
  @@map("pending_orders")
}

// Update Portfolio relation
model Portfolio {
  // ... existing fields
  pendingOrders  PendingOrder[]
}

// Update Holding model to support short positions
model Holding {
  id          String    @id @default(uuid())
  portfolioId String    @map("portfolio_id")
  symbol      String    @db.VarChar(20)
  assetType   AssetType @map("asset_type")
  quantity    Decimal   @db.Decimal(18, 8)  // Negative for short positions
  averageCost Decimal   @map("average_cost") @db.Decimal(15, 4)
  isShort     Boolean   @default(false) @map("is_short")  // NEW
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@unique([portfolioId, symbol, isShort])  // Allow separate long and short positions
  @@index([portfolioId])
  @@index([symbol])
  @@map("holdings")
}

// Add new enums
enum OrderType {
  MARKET
  LIMIT
  AFTER_HOURS

  @@map("order_type")
}

enum OrderStatus {
  PENDING
  EXECUTED
  CANCELLED
  EXPIRED

  @@map("order_status")
}
```

**Task 3.3**: Generate Prisma client and push schema
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Phase 2: Backend - Limit Orders (Day 3-4)

**Task 3.4**: Create pending order service
- File: `backend/src/services/pendingOrderService.ts`

```typescript
import { PrismaClient, OrderType, TradeType, AssetType, OrderStatus } from '@prisma/client';
import { getQuote } from './marketDataService';
import { executeTrade } from './tradeService';
import logger from '../config/logger';

const prisma = new PrismaClient();

export async function createPendingOrder(
  portfolioId: string,
  symbol: string,
  assetType: AssetType,
  tradeType: TradeType,
  orderType: OrderType,
  quantity: number,
  limitPrice?: number
) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await prisma.pendingOrder.create({
    data: {
      portfolioId,
      symbol: symbol.toUpperCase(),
      assetType,
      tradeType,
      orderType,
      quantity,
      limitPrice,
      expiresAt,
    },
  });
}

export async function processPendingOrders() {
  const pendingOrders = await prisma.pendingOrder.findMany({
    where: {
      status: OrderStatus.PENDING,
    },
    include: {
      portfolio: true,
    },
  });

  logger.info(`Processing ${pendingOrders.length} pending orders`);

  for (const order of pendingOrders) {
    try {
      // Check if order expired
      if (order.expiresAt && order.expiresAt < new Date()) {
        await prisma.pendingOrder.update({
          where: { id: order.id },
          data: { status: OrderStatus.EXPIRED },
        });
        continue;
      }

      // Get current price
      const quote = await getQuote(order.symbol, order.assetType);
      const currentPrice = quote.currentPrice;

      // Check if order should execute
      let shouldExecute = false;

      if (order.orderType === OrderType.LIMIT) {
        if (order.tradeType === TradeType.BUY && currentPrice <= (order.limitPrice || 0)) {
          shouldExecute = true;
        } else if (order.tradeType === TradeType.SELL && currentPrice >= (order.limitPrice || 0)) {
          shouldExecute = true;
        }
      } else if (order.orderType === OrderType.AFTER_HOURS) {
        // Check if market is open (simplified - you can add proper market hours logic)
        const hour = new Date().getHours();
        if (hour >= 9 && hour < 16) {
          shouldExecute = true;
        }
      }

      if (shouldExecute) {
        // Execute the trade
        await executeTrade({
          portfolioId: order.portfolioId,
          symbol: order.symbol,
          assetType: order.assetType,
          tradeType: order.tradeType,
          orderType: order.orderType,
          quantity: Number(order.quantity),
        });

        // Mark order as executed
        await prisma.pendingOrder.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.EXECUTED,
            executedAt: new Date(),
          },
        });

        logger.info(`Executed pending order ${order.id} for ${order.symbol}`);
      }
    } catch (error) {
      logger.error(`Error processing pending order ${order.id}:`, error);
    }
  }
}

export async function getUserPendingOrders(portfolioId: string) {
  return await prisma.pendingOrder.findMany({
    where: {
      portfolioId,
      status: OrderStatus.PENDING,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function cancelPendingOrder(orderId: string, portfolioId: string) {
  return await prisma.pendingOrder.update({
    where: {
      id: orderId,
      portfolioId,
    },
    data: {
      status: OrderStatus.CANCELLED,
    },
  });
}
```

**Task 3.5**: Update trade service for order types
- File: `backend/src/services/tradeService.ts`

```typescript
// Update executeBuyOrder to handle order types
export async function executeBuyOrder(params: {
  portfolioId: string;
  symbol: string;
  assetType: AssetType;
  tradeType: TradeType;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;
}) {
  const { portfolioId, symbol, assetType, orderType, quantity, limitPrice } = params;

  // If limit order or after-hours, create pending order
  if (orderType === OrderType.LIMIT || orderType === OrderType.AFTER_HOURS) {
    return await createPendingOrder(
      portfolioId,
      symbol,
      assetType,
      TradeType.BUY,
      orderType,
      quantity,
      limitPrice
    );
  }

  // Execute market order immediately
  // ... existing market order logic
}
```

**Task 3.6**: Update trade controller
- File: `backend/src/controllers/tradeController.ts`

Add endpoint for pending orders:
```typescript
export const getPendingOrders = async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.query;
    const orders = await pendingOrderService.getUserPendingOrders(portfolioId as string);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { portfolioId } = req.body;

    await pendingOrderService.cancelPendingOrder(orderId, portfolioId);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};
```

#### Phase 3: Backend - Short Selling (Day 5)

**Task 3.7**: Implement short selling logic
- File: `backend/src/services/tradeService.ts`

```typescript
export async function executeShortSell(params: {
  portfolioId: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
}) {
  const { portfolioId, symbol, assetType, quantity } = params;

  // Get portfolio
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  // Get current price
  const quote = await getQuote(symbol, assetType);
  const currentPrice = quote.currentPrice;
  const totalValue = currentPrice * quantity;

  // Check margin requirement (simplified - 150% of trade value)
  const marginRequired = totalValue * 1.5;
  if (Number(portfolio.cashBalance) < marginRequired) {
    throw new Error('Insufficient margin for short position');
  }

  // Create or update short position
  const existingShort = await prisma.holding.findUnique({
    where: {
      portfolioId_symbol_isShort: {
        portfolioId,
        symbol: symbol.toUpperCase(),
        isShort: true,
      },
    },
  });

  if (existingShort) {
    // Add to existing short position
    const newQuantity = Number(existingShort.quantity) + quantity;
    const newAverageCost =
      (Number(existingShort.averageCost) * Number(existingShort.quantity) + currentPrice * quantity) /
      newQuantity;

    await prisma.holding.update({
      where: { id: existingShort.id },
      data: {
        quantity: newQuantity,
        averageCost: newAverageCost,
      },
    });
  } else {
    // Create new short position
    await prisma.holding.create({
      data: {
        portfolioId,
        symbol: symbol.toUpperCase(),
        assetType,
        quantity,
        averageCost: currentPrice,
        isShort: true,
      },
    });
  }

  // Reserve margin (deduct from cash)
  const newCashBalance = Number(portfolio.cashBalance) - marginRequired;

  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { cashBalance: newCashBalance },
  });

  // Record trade
  const trade = await prisma.trade.create({
    data: {
      portfolioId,
      symbol: symbol.toUpperCase(),
      assetType,
      tradeType: TradeType.SELL,
      orderType: OrderType.MARKET,
      quantity,
      price: currentPrice,
      totalValue,
    },
  });

  return { trade, portfolio: { cashBalance: newCashBalance } };
}

export async function coverShortPosition(params: {
  portfolioId: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
}) {
  // Similar logic to cover (buy back) short position
  // Calculate profit/loss
  // Release margin
}
```

#### Phase 4: Background Job for Pending Orders (Day 6)

**Task 3.8**: Add cron job for pending orders
- File: `backend/src/jobs/scheduledJobs.ts`

```typescript
import { processPendingOrders } from '../services/pendingOrderService';

// Process pending orders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await processPendingOrders();
});
```

#### Phase 5: Frontend - Trading Modal Updates (Day 7)

**Task 3.9**: Update TradingModal component
- File: `frontend/src/components/TradingModal.tsx`

Add order type selection:
```typescript
const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'AFTER_HOURS'>('MARKET');
const [limitPrice, setLimitPrice] = useState<string>('');
const [isShortSell, setIsShortSell] = useState(false);

// In the JSX:
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">Order Type</label>
  <select
    value={orderType}
    onChange={(e) => setOrderType(e.target.value as any)}
    className="input w-full"
  >
    <option value="MARKET">Market Order</option>
    <option value="LIMIT">Limit Order</option>
    <option value="AFTER_HOURS">After-Hours Order</option>
  </select>
</div>

{orderType === 'LIMIT' && (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Limit Price</label>
    <input
      type="number"
      step="0.01"
      value={limitPrice}
      onChange={(e) => setLimitPrice(e.target.value)}
      placeholder="Enter limit price"
      className="input w-full"
    />
  </div>
)}

{tradeType === 'SELL' && (
  <div className="mb-4">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={isShortSell}
        onChange={(e) => setIsShortSell(e.target.checked)}
        className="checkbox"
      />
      <span className="text-sm">Short Sell (borrow and sell)</span>
    </label>
  </div>
)}
```

#### Phase 6: Frontend - Historical Charts (Day 8-9)

**Task 3.10**: Create HistoricalChart component
- File: `frontend/src/components/HistoricalChart.tsx`

```typescript
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import marketService from '../services/marketService';

interface HistoricalChartProps {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO';
}

export default function HistoricalChart({ symbol, assetType }: HistoricalChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, [symbol, period]);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const response = await marketService.getHistoricalData(symbol, period);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading chart...</div>;
  }

  return (
    <div className="card">
      <div className="mb-4 flex gap-2">
        {['day', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} text-sm`}
          >
            {p === 'day' ? '1D' : p === 'week' ? '1W' : p === 'month' ? '1M' : '1Y'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
            stroke="#9ca3af"
          />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Task 3.11**: Create Charts page
- File: `frontend/src/pages/Charts.tsx`

```typescript
import { useState } from 'react';
import Navigation from '../components/Navigation';
import HistoricalChart from '../components/HistoricalChart';
import marketService from '../services/marketService';

export default function Charts() {
  const [symbol, setSymbol] = useState('AAPL');
  const [assetType, setAssetType] = useState<'STOCK' | 'CRYPTO'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const results = await marketService.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSelectSymbol = (result: any) => {
    setSymbol(result.symbol);
    setAssetType(result.assetType);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Historical Charts</h1>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a stock or crypto..."
              className="input flex-1"
            />
            <button onClick={handleSearch} className="btn btn-primary">
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 card">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelectSymbol(result)}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="font-bold">{result.symbol}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {result.name || result.assetType}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold">{symbol}</h2>
          <span className="badge badge-info">{assetType}</span>
        </div>

        <HistoricalChart symbol={symbol} assetType={assetType} />
      </main>
    </>
  );
}
```

**Task 3.12**: Add Charts route
- File: `frontend/src/App.tsx`

```typescript
import Charts from './pages/Charts';

<Route path="/charts" element={<Charts />} />
```

- File: `frontend/src/components/Navigation.tsx`

```typescript
<Link to="/charts" className={navLinkClass('/charts')}>
  Charts
</Link>
```

#### Phase 7: Testing & Documentation (Day 10)

**Task 3.13**: Test advanced trading features
```bash
# Test limit order
curl -X POST http://localhost:3001/api/trades/buy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId":"<id>",
    "symbol":"AAPL",
    "assetType":"STOCK",
    "orderType":"LIMIT",
    "quantity":10,
    "limitPrice":250.00
  }'

# Test pending orders
curl -X GET http://localhost:3001/api/trades/pending?portfolioId=<id> \
  -H "Authorization: Bearer <token>"

# Test short selling
curl -X POST http://localhost:3001/api/trades/short \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId":"<id>",
    "symbol":"TSLA",
    "assetType":"STOCK",
    "quantity":5
  }'
```

**Task 3.14**: Create Pull Request
- Title: `feat: Add advanced trading features (limit orders, after-hours, short selling) and historical charts`
- Description: Include detailed explanation, screenshots, testing results
- Request reviews from Person 1 and Person 2

### Deliverables

- ✅ Limit order functionality
- ✅ After-hours order queueing
- ✅ Short selling with margin requirements
- ✅ Pending order processor (background job)
- ✅ Updated TradingModal with order types
- ✅ Historical charts page with Recharts
- ✅ Chart time period filters
- ✅ Database schema updates
- ✅ Pull request created

---

## Testing Requirements

### Unit Tests
Each person should write unit tests for their services:

```typescript
// Example test structure
describe('WatchlistService', () => {
  it('should add symbol to watchlist', async () => {
    // Test implementation
  });

  it('should remove symbol from watchlist', async () => {
    // Test implementation
  });

  it('should prevent duplicate watchlist entries', async () => {
    // Test implementation
  });
});
```

### Integration Tests
Test API endpoints with actual database:

```bash
npm test -- watchlist.test.ts
```

### Manual Testing Checklist

**Person 1 (Rate Limiting)**:
- [ ] Test API failover (Alpha Vantage → yfinance → Finnhub)
- [ ] Test rate limiting with rapid requests
- [ ] Verify cache TTL increase
- [ ] Check background job optimization

**Person 2 (Watchlist)**:
- [ ] Add asset to watchlist
- [ ] Remove asset from watchlist
- [ ] View watchlist with real-time prices
- [ ] Test duplicate prevention
- [ ] Test watchlist across multiple users

**Person 3 (Advanced Trading)**:
- [ ] Place limit order (above and below current price)
- [ ] Place after-hours order
- [ ] Execute short sell
- [ ] View pending orders
- [ ] Cancel pending order
- [ ] View historical charts for different periods
- [ ] Test chart responsiveness

---

## Pull Request Guidelines

### PR Title Format
```
<type>: <short description>

Examples:
feat: Add watchlist feature for monitoring favorite assets
fix: Resolve rate limiting issue with Alpha Vantage API
refactor: Optimize pending order processing logic
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Changes Made
- Added X feature
- Updated Y component
- Fixed Z bug

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested on different browsers

## Screenshots
(If applicable, add screenshots of UI changes)

## API Changes
List any new endpoints or changes to existing endpoints:
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add to watchlist

## Database Changes
- Added `watchlists` table
- Updated `trades` table with `orderType` field

## Breaking Changes
List any breaking changes (hopefully none!)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements left
- [ ] Tested locally
- [ ] Ready for review

## Related Issues
Closes #123
Related to #456
```

### Code Review Process

1. **Self-Review**: Review your own code before creating PR
2. **Request Reviews**: Tag both other team members
3. **Address Feedback**: Respond to all comments
4. **Update PR**: Make requested changes
5. **Merge**: After 2 approvals, merge to dev

### Merge Strategy
```bash
# Squash commits when merging to dev
git checkout dev
git pull origin dev
git merge --squash feature/your-branch
git commit -m "feat: descriptive commit message"
git push origin dev
```

---

## Timeline Summary

| Week | Person 1 | Person 2 | Person 3 |
|------|----------|----------|----------|
| Week 1 | Rate limiting setup & API implementation | Watchlist backend & database | Advanced trading schema & limit orders |
| Week 2 | Testing & optimization | Watchlist frontend & UI | Short selling & historical charts |
| Week 3 | PR review & merge | PR review & merge | PR review & merge |

---

## Communication

### Daily Standup (Recommended)
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

### Slack/Discord Channels
- `#feature-rate-limiting` - Person 1 updates
- `#feature-watchlist` - Person 2 updates
- `#feature-advanced-trading` - Person 3 updates
- `#dev-general` - Team discussions
- `#pull-requests` - PR notifications

### Code Review Response Time
- Respond to PR reviews within 24 hours
- Merge approved PRs within 48 hours

---

## Dependencies Between Features

### No Dependencies
All three features are **independent** and can be developed in parallel without conflicts.

### Potential Merge Conflicts
- Navigation.tsx (all adding links)
- App.tsx (all adding routes)
- Prisma schema (Person 2 and 3 both updating)

**Resolution**: Last person to create PR should resolve conflicts by including all changes.

---

**Good luck team! Let's build these features! 🚀**
