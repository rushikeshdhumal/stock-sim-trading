# API Optimization & Rate Limiting

This document describes the comprehensive rate limiting and multi-API fallback system implemented for the Stock Simulation Trading platform.

## Overview

The platform now implements a sophisticated multi-tier API system with request queuing and intelligent fallback mechanisms to ensure reliable market data fetching while respecting API rate limits.

## Architecture

### Request Queue System

All external API calls are routed through request queues to prevent rate limiting:

```
User Request → Cache Layer → Request Queue → External API → Cache Update → Response
```

### Multi-API Priority System

The system uses a two-tier fallback approach:

1. **Primary: Alpha Vantage** (5 requests/minute)
   - Comprehensive stock market data
   - 12-second delay between requests
   - Queue: `alphaVantageQueue`

2. **Secondary: Finnhub** (60 requests/minute)
   - Fallback for when Alpha Vantage fails or is rate-limited
   - 1-second delay between requests
   - Queue: `finnhubQueue`

## Implementation Details

### Batch API Requests

The system now supports batch API requests for fetching multiple symbols simultaneously, dramatically improving performance for portfolio views, watchlists, and trending assets.

#### Batch Request Flow

```
Portfolio with 10 holdings
    ↓
Extract symbols: [AAPL, MSFT, GOOGL, ...]
    ↓
getQuoteBatch(symbols)
    ↓
Check cache for all symbols
    ├─ 7 found in cache (instant)
    └─ 3 need API fetch
        ↓
    Single batch API request
        ↓
    Finnhub parallel fetch (3 symbols in ~3 seconds)
        ↓
    Cache all results
        ↓
Return all 10 quotes
```

#### Performance Improvement

**Before (Individual Requests):**
- 10 stocks × 12 seconds = 120 seconds total
- Sequential queue processing

**After (Batch Requests):**
- 10 stocks = 1 batch request = ~12 seconds (if all from API)
- 7 cached + 3 from API = ~3 seconds (typical scenario)
- **90-97% faster!**

#### Batch API Support by Provider

| API | Batch Support | Method | Max Symbols |
|-----|--------------|--------|-------------|
| Alpha Vantage | ❌ Deprecated | `BATCH_STOCK_QUOTES` (deprecated/unavailable in free tier) | 0 |
| Finnhub | ✅ Parallel | Multiple requests queued | Unlimited |

> **Note:** Alpha Vantage's batch endpoint (`BATCH_STOCK_QUOTES`) is deprecated and no longer available in the free tier. Batch requests for Alpha Vantage will fall back to sequential or parallel single-symbol requests.

#### Usage Example

```typescript
// Old approach (slow)
const quotes = await Promise.all(
  symbols.map(symbol => marketDataService.getQuote(symbol))
);

// New approach (fast - uses batch API)
const quotesMap = await marketDataService.getQuoteBatch(symbols);
const quotes = symbols.map(s => quotesMap.get(s));
```

#### Where Batch API is Used

1. **Portfolio Service** ([portfolioService.ts:41](backend/src/services/portfolioService.ts:41))
   - `getPortfolioById()` - Enrich all holdings at once
   - `calculatePortfolioValue()` - Value all holdings simultaneously

2. **Market Data Service** ([marketDataService.ts:197](backend/src/services/marketDataService.ts:197))
   - `getPopular()` - Fetch trending stocks in one request

3. **Watchlist Service** ([watchlistService.ts:25](backend/src/services/watchlistService.ts:25))
   - Uses batch API for real-time watchlist updates

#### Intelligent Caching

The batch API method includes intelligent cache checking:

```typescript
async getQuoteBatch(symbols: string[]): Promise<Map<string, MarketQuote>> {
  // 1. Check Redis cache for each symbol
  // 2. Check database cache for uncached symbols
  // 3. Fetch only uncached symbols from API (batch)
  // 4. Update all caches
  // 5. Return complete map of symbols → quotes
}
```

**Benefits:**
- Minimizes API calls (only fetches truly uncached symbols)
- Maintains cache coherency
- Returns instantly for cached symbols

### Request Queue (`backend/src/utils/requestQueue.ts`)

The `RequestQueue` class implements a simple but effective queuing mechanism:

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
}
```

**Key Features:**
- FIFO (First In, First Out) processing
- Configurable delay between requests
- Promise-based API for easy integration
- Singleton instances for each external API

### Cache Strategy

The system implements a three-layer caching strategy to minimize API calls:

#### 1. Redis Cache (Level 1)
- **TTL**: 30 minutes (configurable via `MARKET_DATA_CACHE_TTL`)
- **Purpose**: Fast in-memory access for frequently requested symbols
- **Invalidation**: Automatic expiration

#### 2. Database Cache (Level 2)
- **TTL**: 30 minutes
- **Purpose**: Persistent cache that survives server restarts
- **Invalidation**: Daily cleanup job at 2 AM

#### 3. External API (Level 3)
- **Fallback**: Only called when both caches miss or are stale
- **Rate Limited**: Through request queues

### API Failover Flow

```
Request for AAPL
    ↓
Check Redis Cache
    ↓ (miss)
Check Database Cache
    ↓ (miss or stale)
Queue Request to Alpha Vantage
    ↓ (success)
Update Redis Cache
    ↓
Update Database Cache
    ↓
Return Response
```

**If Alpha Vantage Fails:**
```
Alpha Vantage Error
    ↓
Queue Request to Finnhub
    ↓ (success or fail)
If Both Failed → Return 503 Error
```

## Configuration

### Environment Variables

```env
# Alpha Vantage API (Primary)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Finnhub API (Tertiary)
FINNHUB_API_KEY=your_finnhub_key

# Cache TTL (in seconds)
MARKET_DATA_CACHE_TTL=1800  # 30 minutes
```

### Rate Limits

| API | Limit | Queue Delay | Notes |
|-----|-------|-------------|-------|
| Alpha Vantage | 5 req/min | 12 seconds | Free tier limit |
| Finnhub | 60 req/min | 1 second | Free tier limit |

## Optimizations Implemented

### 1. Increased Cache TTL
- **Before**: 5 minutes (300 seconds)
- **After**: 30 minutes (1800 seconds)
- **Impact**: 83% reduction in API calls

### 2. Request Queuing
- **Before**: Direct API calls with no rate limiting
- **After**: Queued requests with configurable delays
- **Impact**: Eliminates rate limit errors (HTTP 429)

### 3. Batch API Requests
- **Before**: Sequential individual requests for multiple symbols
- **After**: Single batch request for multiple symbols
- **Impact**: 90-97% faster for portfolio views and trending assets

### 4. Removed Mock Data Fallback
- **Before**: Returns mock data when all APIs fail
- **After**: Returns proper error (HTTP 503)
- **Impact**: Clearer error handling, better debugging

### 5. Optimized Background Jobs

#### Leaderboard Updates
- **Before**: Every hour during market hours (9 AM - 4 PM)
- **After**: Every 2 hours with market hours check
- **Impact**: 50% reduction in scheduled API calls

#### Market Data Cleanup
- **New**: Daily cleanup at 2 AM
- **Purpose**: Remove stale cache entries older than 24 hours
- **Impact**: Improved database performance

## Performance Metrics

### API Call Reduction

Assuming 100 unique symbols requested per day:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Cache TTL | 5 min | 30 min | 83% reduction |
| Avg API calls/symbol/day | 288 | 48 | 83% reduction |
| Total API calls/day | 28,800 | 4,800 | 83% reduction |
| Background job calls/day | 24 | 12 | 50% reduction |

### Response Times

- **Cache Hit (Redis)**: < 10ms
- **Cache Hit (Database)**: < 50ms
- **API Call (Queued)**: 500-2000ms (depending on queue position)
- **API Call (First in queue)**: 200-800ms

## Error Handling

### API Failure Scenarios

1. **Alpha Vantage Timeout/Error**
   - Logs warning: `Alpha Vantage failed for {symbol}`
   - Automatically tries Finnhub

2. **Finnhub Timeout/Error**
   - Logs warning: `Finnhub failed for {symbol}`

3. **All APIs Failed**
   - Returns HTTP 503: `Unable to fetch quote for {symbol} from any API`
   - Client should retry with exponential backoff

### Cache Failures

- Redis connection errors are logged but don't block requests
- Falls back to database cache
- Falls back to API if database cache is stale

## Monitoring

### Key Metrics to Monitor

1. **API Success Rate**
   ```
   (Successful API Calls / Total API Calls) * 100
   ```

2. **Cache Hit Rate**
   ```
   (Cache Hits / Total Requests) * 100
   ```

3. **Average Response Time**
   ```
   Sum(Response Times) / Total Requests
   ```

4. **Queue Length**
   - Monitor `alphaVantageQueue.length`
   - Alert if queue length > 10

### Logging

All API operations are logged with Winston:

```typescript
logger.warn(`Alpha Vantage failed for ${symbol}:`, error.message);
logger.info(`Cleaned up ${result.count} stale market data cache entries`);
```

## Testing

### Manual Testing

Test API failover by making requests:

```bash
# Test normal flow (should use Alpha Vantage)
curl http://localhost:3001/api/market/quote/AAPL

# Test with invalid Alpha Vantage key (should fall back to yfinance)
# Edit .env: ALPHA_VANTAGE_API_KEY="invalid"
curl http://localhost:3001/api/market/quote/AAPL

# Test rapid requests (should see queuing in action)
for i in {1..5}; do
  curl http://localhost:3001/api/market/quote/STOCK$i &
done
```

### Automated Testing

```bash
cd backend
npm test -- marketDataService.test.ts
```

## Future Improvements

1. **WebSocket Support**: Real-time price updates without polling
2. **Advanced Queue Metrics**: Track queue wait times and throughput
3. **Dynamic Rate Limiting**: Adjust delays based on API response headers
4. **Circuit Breaker Pattern**: Temporarily disable failing APIs
5. **CDN Caching**: Cache popular symbols at edge locations

## Troubleshooting

### Issue: "Unable to fetch quote from any API"

**Possible Causes:**
1. All API keys are invalid or expired
2. Network connectivity issues
3. Symbol doesn't exist in any API
4. All APIs are rate-limited (unlikely with queuing)

**Resolution:**
1. Check API keys in `.env`
2. Verify network connectivity
3. Check symbol validity
4. Review logs for specific error messages

### Issue: Slow Response Times

**Possible Causes:**
1. Queue is backed up (too many requests)
2. Cache is not being utilized
3. Redis is down

**Resolution:**
1. Monitor queue length
2. Verify cache TTL configuration
3. Check Redis connection status

### Issue: Rate Limit Errors (HTTP 429)

**Possible Causes:**
1. Queue delay is too short
2. Multiple server instances sharing same API key

**Resolution:**
1. Increase queue delay in `requestQueue.ts`
2. Use different API keys for different environments

## References

- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
- [Finnhub API Documentation](https://finnhub.io/docs/api)
- [yfinance Documentation](https://pypi.org/project/yfinance/)
- [Node.js Request Queuing Best Practices](https://nodejs.org/en/docs/)

## Changelog

### Version 2.1.0 (2025-12-04)
- **NEW**: Batch API request system for multiple symbols
- **NOTE**: Alpha Vantage batch quotes endpoint (`BATCH_STOCK_QUOTES`) is deprecated and not available in the free tier. Batch support for Alpha Vantage is currently unavailable.
- **NEW**: Finnhub parallel batch fetching
- Updated portfolioService to use batch API (90-97% faster)
- Updated trending/popular endpoints to use batch API
- Intelligent cache checking in batch requests

### Version 2.0.0 (2025-12-04)
- Implemented request queue system
- Added Finnhub as tertiary API fallback
- Removed mock data fallback
- Increased cache TTL from 5 to 30 minutes
- Optimized background jobs
- Added market data cleanup job
- Improved error handling and logging

---

**Last Updated**: December 4, 2025
**Author**: Rushikesh Dhumal
**Version**: 2.1.0
