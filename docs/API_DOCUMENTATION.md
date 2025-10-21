# API Documentation

Complete API reference for the Stock Market Simulation & Trading Game backend.

**Base URL**: `http://localhost:3001/api`
**Authentication**: JWT Bearer tokens (where required)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Portfolio Management](#portfolio-management)
3. [Trading](#trading)
4. [Market Data](#market-data)
5. [Leaderboards](#leaderboards)
6. [Achievements](#achievements)
7. [Challenges](#challenges)
8. [Error Responses](#error-responses)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

All authentication endpoints use rate limiting (max 5 requests per 15 minutes per IP).

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`
**Authentication**: Not required
**Rate Limited**: Yes

**Request Body**:
```json
{
  "username": "string",    // 3-50 chars, alphanumeric + underscore
  "email": "string",       // Valid email format
  "password": "string"     // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
}
```

**Success Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "startingBalance": 100000,
    "createdAt": "2025-10-21T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Errors** (400):
```json
{
  "error": "Validation Error",
  "details": [
    "Password must contain at least one uppercase letter"
  ]
}
```

**Conflict** (409):
```json
{
  "error": "User already exists"
}
```

---

### Login

Authenticate and receive JWT tokens.

**Endpoint**: `POST /api/auth/login`
**Authentication**: Not required
**Rate Limited**: Yes

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "startingBalance": 100000,
    "createdAt": "2025-10-21T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (401):
```json
{
  "error": "Invalid credentials"
}
```

---

### Get Current User

Retrieve authenticated user's profile.

**Endpoint**: `GET /api/auth/me`
**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "startingBalance": 100000,
  "createdAt": "2025-10-21T10:00:00.000Z"
}
```

---

### Update Profile

Update user profile information.

**Endpoint**: `PUT /api/auth/profile`
**Authentication**: Required

**Request Body**:
```json
{
  "username": "newusername",  // Optional
  "email": "newemail@example.com"  // Optional
}
```

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "username": "newusername",
  "email": "newemail@example.com",
  "startingBalance": 100000,
  "createdAt": "2025-10-21T10:00:00.000Z"
}
```

---

### Logout

Invalidate current session.

**Endpoint**: `POST /api/auth/logout`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## Portfolio Management

### Get All Portfolios

Retrieve all portfolios for authenticated user.

**Endpoint**: `GET /api/portfolios`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "portfolios": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Main Portfolio",
      "cashBalance": 95000.50,
      "totalValue": 105234.75,
      "createdAt": "2025-10-21T10:00:00.000Z"
    }
  ]
}
```

---

### Create Portfolio

Create a new portfolio.

**Endpoint**: `POST /api/portfolios`
**Authentication**: Required

**Request Body**:
```json
{
  "name": "Tech Stocks Portfolio",
  "initialBalance": 50000  // Optional, defaults to 100000
}
```

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Tech Stocks Portfolio",
  "cashBalance": 50000,
  "totalValue": 50000,
  "createdAt": "2025-10-21T10:00:00.000Z"
}
```

---

### Get Portfolio Details

Retrieve portfolio with all holdings and current values.

**Endpoint**: `GET /api/portfolios/:id`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Main Portfolio",
  "cashBalance": 95000.50,
  "totalValue": 105234.75,
  "holdings": [
    {
      "id": "uuid",
      "symbol": "AAPL",
      "assetType": "STOCK",
      "quantity": 50,
      "averageCost": 150.25,
      "currentPrice": 175.50,
      "currentValue": 8775.00,
      "profitLoss": 1262.50,
      "profitLossPercentage": 16.78
    },
    {
      "id": "uuid",
      "symbol": "BTC",
      "assetType": "CRYPTO",
      "quantity": 0.5,
      "averageCost": 45000,
      "currentPrice": 48000,
      "currentValue": 24000,
      "profitLoss": 1500,
      "profitLossPercentage": 6.67
    }
  ],
  "createdAt": "2025-10-21T10:00:00.000Z"
}
```

**Error Response** (404):
```json
{
  "error": "Portfolio not found"
}
```

**Error Response** (403):
```json
{
  "error": "Access denied"
}
```

---

### Get Portfolio Value

Calculate total current portfolio value.

**Endpoint**: `GET /api/portfolios/:id/value`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "portfolioId": "uuid",
  "cashBalance": 95000.50,
  "holdingsValue": 32775.00,
  "totalValue": 127775.50
}
```

---

### Get Portfolio Performance

Retrieve portfolio performance metrics.

**Endpoint**: `GET /api/portfolios/:id/performance`
**Authentication**: Required

**Query Parameters**:
- `period` (optional): `day` | `week` | `month` | `year` | `all` (default: `all`)

**Success Response** (200 OK):
```json
{
  "portfolioId": "uuid",
  "period": "all",
  "initialValue": 100000,
  "currentValue": 127775.50,
  "totalReturn": 27775.50,
  "totalReturnPercentage": 27.78,
  "totalTrades": 15,
  "winningTrades": 10,
  "losingTrades": 5,
  "winRate": 66.67
}
```

---

## Trading

### Execute Buy Order

Purchase stocks or cryptocurrency.

**Endpoint**: `POST /api/trades/buy`
**Authentication**: Required

**Request Body**:
```json
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "assetType": "STOCK",  // STOCK or CRYPTO
  "tradeType": "BUY",
  "quantity": 10
}
```

**Success Response** (201 Created):
```json
{
  "trade": {
    "id": "uuid",
    "symbol": "AAPL",
    "assetType": "STOCK",
    "tradeType": "BUY",
    "quantity": 10,
    "price": 175.50,
    "totalValue": 1755.00,
    "executedAt": "2025-10-21T14:30:00.000Z"
  },
  "portfolio": {
    "cashBalance": 93245.50,
    "totalValue": 106989.75
  }
}
```

**Error Responses**:

Insufficient funds (400):
```json
{
  "error": "Insufficient cash balance",
  "required": 1755.00,
  "available": 1500.00
}
```

Invalid symbol (404):
```json
{
  "error": "Symbol not found or market data unavailable"
}
```

---

### Execute Sell Order

Sell stocks or cryptocurrency.

**Endpoint**: `POST /api/trades/sell`
**Authentication**: Required

**Request Body**:
```json
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "assetType": "STOCK",
  "tradeType": "SELL",
  "quantity": 5
}
```

**Success Response** (201 Created):
```json
{
  "trade": {
    "id": "uuid",
    "symbol": "AAPL",
    "assetType": "STOCK",
    "tradeType": "SELL",
    "quantity": 5,
    "price": 176.25,
    "totalValue": 881.25,
    "executedAt": "2025-10-21T15:00:00.000Z"
  },
  "portfolio": {
    "cashBalance": 94126.75,
    "totalValue": 106870.50
  }
}
```

**Error Response** (400):
```json
{
  "error": "Insufficient holdings",
  "required": 5,
  "available": 3
}
```

---

### Get Trade History

Retrieve filtered trade history.

**Endpoint**: `GET /api/trades/history`
**Authentication**: Required

**Query Parameters**:
- `portfolioId` (optional): Filter by portfolio UUID
- `symbol` (optional): Filter by stock/crypto symbol
- `tradeType` (optional): `BUY` or `SELL`
- `assetType` (optional): `STOCK` or `CRYPTO`
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example**: `GET /api/trades/history?portfolioId=uuid&limit=10&tradeType=BUY`

**Success Response** (200 OK):
```json
{
  "trades": [
    {
      "id": "uuid",
      "portfolioId": "uuid",
      "symbol": "AAPL",
      "assetType": "STOCK",
      "tradeType": "BUY",
      "quantity": 10,
      "price": 175.50,
      "totalValue": 1755.00,
      "executedAt": "2025-10-21T14:30:00.000Z"
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

---

### Validate Trade

Pre-validate a trade without executing it.

**Endpoint**: `POST /api/trades/validate`
**Authentication**: Required

**Request Body**:
```json
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "assetType": "STOCK",
  "tradeType": "BUY",
  "quantity": 10
}
```

**Success Response** (200 OK):
```json
{
  "valid": true,
  "symbol": "AAPL",
  "currentPrice": 175.50,
  "quantity": 10,
  "estimatedTotal": 1755.00,
  "cashBalance": 95000.50,
  "remainingBalance": 93245.50
}
```

**Error Response** (400):
```json
{
  "valid": false,
  "error": "Insufficient cash balance",
  "required": 1755.00,
  "available": 1500.00
}
```

---

## Market Data

### Search Stocks/Crypto

Search for stocks or cryptocurrencies by symbol or name.

**Endpoint**: `GET /api/market/search`
**Authentication**: Required

**Query Parameters**:
- `q` (required): Search query (symbol or company name)
- `type` (optional): `stock` | `crypto` | `all` (default: `all`)

**Example**: `GET /api/market/search?q=apple&type=stock`

**Success Response** (200 OK):
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "assetType": "STOCK",
      "exchange": "NASDAQ",
      "currency": "USD"
    },
    {
      "symbol": "APLE",
      "name": "Apple Hospitality REIT Inc.",
      "assetType": "STOCK",
      "exchange": "NYSE",
      "currency": "USD"
    }
  ]
}
```

---

### Get Quote

Retrieve current price for a symbol.

**Endpoint**: `GET /api/market/quote/:symbol`
**Authentication**: Required

**Example**: `GET /api/market/quote/AAPL`

**Success Response** (200 OK):
```json
{
  "symbol": "AAPL",
  "assetType": "STOCK",
  "currentPrice": 175.50,
  "change24h": 2.75,
  "changePercentage": 1.59,
  "volume": 65432100,
  "marketCap": 2750000000000,
  "lastUpdated": "2025-10-21T15:30:00.000Z"
}
```

**Data Sources**:
1. Redis cache (5 min TTL) - if available
2. Database cache (30 min TTL) - if available
3. Alpha Vantage API - primary source
4. Yahoo Finance - fallback if Alpha Vantage fails

**Error Response** (404):
```json
{
  "error": "Symbol not found or market data unavailable"
}
```

---

### Get Historical Data

Retrieve historical price data.

**Endpoint**: `GET /api/market/historical/:symbol`
**Authentication**: Required

**Query Parameters**:
- `period` (optional): `day` | `week` | `month` | `year` (default: `month`)
- `interval` (optional): `1min` | `5min` | `15min` | `30min` | `60min` | `daily` (default: `daily`)

**Example**: `GET /api/market/historical/AAPL?period=week&interval=daily`

**Success Response** (200 OK):
```json
{
  "symbol": "AAPL",
  "assetType": "STOCK",
  "period": "week",
  "interval": "daily",
  "data": [
    {
      "timestamp": "2025-10-14T00:00:00.000Z",
      "open": 170.50,
      "high": 172.25,
      "low": 169.75,
      "close": 171.50,
      "volume": 55123000
    },
    {
      "timestamp": "2025-10-15T00:00:00.000Z",
      "open": 171.75,
      "high": 173.50,
      "low": 171.00,
      "close": 172.75,
      "volume": 58234000
    }
  ]
}
```

---

### Get Trending Assets

Retrieve trending stocks and cryptocurrencies.

**Endpoint**: `GET /api/market/trending`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "currentPrice": 175.50,
      "changePercentage": 2.15
    },
    {
      "symbol": "TSLA",
      "name": "Tesla Inc.",
      "currentPrice": 245.75,
      "changePercentage": 3.42
    }
  ],
  "crypto": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "currentPrice": 48250.50,
      "changePercentage": 1.85
    }
  ]
}
```

---

### Get Popular Assets

Retrieve most traded assets on the platform.

**Endpoint**: `GET /api/market/popular`
**Authentication**: Required

**Query Parameters**:
- `period` (optional): `day` | `week` | `month` (default: `week`)
- `limit` (optional): Number of results (default: 10, max: 50)

**Success Response** (200 OK):
```json
{
  "period": "week",
  "assets": [
    {
      "symbol": "AAPL",
      "assetType": "STOCK",
      "tradeCount": 245,
      "totalVolume": 12500,
      "currentPrice": 175.50
    },
    {
      "symbol": "BTC",
      "assetType": "CRYPTO",
      "tradeCount": 187,
      "totalVolume": 125.5,
      "currentPrice": 48250.50
    }
  ]
}
```

---

## Leaderboards

### Get Leaderboard

Retrieve user rankings by period.

**Endpoint**: `GET /api/leaderboards/:period`
**Authentication**: Required

**Parameters**:
- `period`: `daily` | `weekly` | `monthly` | `all-time`

**Query Parameters**:
- `limit` (optional): Number of results (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Example**: `GET /api/leaderboards/weekly?limit=10`

**Success Response** (200 OK):
```json
{
  "period": "weekly",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "tradingpro",
      "portfolioValue": 125450.75,
      "totalReturn": 25450.75,
      "returnPercentage": 25.45,
      "updatedAt": "2025-10-21T16:00:00.000Z"
    },
    {
      "rank": 2,
      "userId": "uuid",
      "username": "stockmaster",
      "portfolioValue": 118234.50,
      "totalReturn": 18234.50,
      "returnPercentage": 18.23,
      "updatedAt": "2025-10-21T16:00:00.000Z"
    }
  ],
  "total": 542,
  "limit": 10,
  "offset": 0
}
```

---

### Get User Rank

Retrieve specific user's rank across all periods.

**Endpoint**: `GET /api/leaderboards/user/:userId`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "userId": "uuid",
  "username": "johndoe",
  "rankings": {
    "daily": {
      "rank": 15,
      "totalUsers": 542,
      "portfolioValue": 105234.75,
      "returnPercentage": 5.23
    },
    "weekly": {
      "rank": 42,
      "totalUsers": 542,
      "portfolioValue": 105234.75,
      "returnPercentage": 5.23
    },
    "monthly": {
      "rank": 67,
      "totalUsers": 542,
      "portfolioValue": 105234.75,
      "returnPercentage": 5.23
    },
    "all-time": {
      "rank": 89,
      "totalUsers": 542,
      "portfolioValue": 105234.75,
      "returnPercentage": 5.23
    }
  }
}
```

---

## Achievements

### List All Achievements

Retrieve all available achievements.

**Endpoint**: `GET /api/achievements`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "achievements": [
    {
      "id": "uuid",
      "name": "First Trade",
      "description": "Execute your first trade",
      "badgeIcon": "🎯",
      "category": "trading",
      "requirement": 1,
      "points": 10
    },
    {
      "id": "uuid",
      "name": "Portfolio Millionaire",
      "description": "Reach $1,000,000 portfolio value",
      "badgeIcon": "💰",
      "category": "milestone",
      "requirement": 1000000,
      "points": 500
    }
  ]
}
```

---

### Get User Achievements

Retrieve achievements earned by a specific user.

**Endpoint**: `GET /api/achievements/user/:userId`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "userId": "uuid",
  "totalPoints": 250,
  "achievements": [
    {
      "id": "uuid",
      "name": "First Trade",
      "description": "Execute your first trade",
      "badgeIcon": "🎯",
      "category": "trading",
      "points": 10,
      "earnedAt": "2025-10-21T10:30:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Day Trader",
      "description": "Execute 10 trades in one day",
      "badgeIcon": "📈",
      "category": "trading",
      "points": 50,
      "earnedAt": "2025-10-21T16:45:00.000Z"
    }
  ]
}
```

---

## Challenges

### List Active Challenges

Retrieve all active challenges.

**Endpoint**: `GET /api/challenges`
**Authentication**: Required

**Query Parameters**:
- `status` (optional): `active` | `upcoming` | `completed` (default: `active`)

**Success Response** (200 OK):
```json
{
  "challenges": [
    {
      "id": "uuid",
      "name": "Tech Stock Challenge",
      "description": "Maximum returns trading only tech stocks",
      "startDate": "2025-10-20T00:00:00.000Z",
      "endDate": "2025-10-27T23:59:59.000Z",
      "status": "active",
      "rules": {
        "allowedSectors": ["technology"],
        "initialBalance": 50000
      },
      "participants": 127,
      "prize": "Achievement Badge + 100 points"
    }
  ]
}
```

---

### Join Challenge

Join an active challenge.

**Endpoint**: `POST /api/challenges/:id/join`
**Authentication**: Required

**Request Body**:
```json
{
  "portfolioId": "uuid"
}
```

**Success Response** (200 OK):
```json
{
  "challengeId": "uuid",
  "portfolioId": "uuid",
  "joinedAt": "2025-10-21T17:00:00.000Z",
  "status": "active"
}
```

**Error Response** (400):
```json
{
  "error": "Already participating in this challenge"
}
```

---

### Get User Challenges

Retrieve authenticated user's active challenges.

**Endpoint**: `GET /api/challenges/user`
**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "challenges": [
    {
      "challengeId": "uuid",
      "name": "Tech Stock Challenge",
      "portfolioId": "uuid",
      "currentRank": 15,
      "totalParticipants": 127,
      "portfolioValue": 52450.75,
      "returnPercentage": 4.90,
      "endDate": "2025-10-27T23:59:59.000Z"
    }
  ]
}
```

---

### Get Challenge Leaderboard

Retrieve rankings for a specific challenge.

**Endpoint**: `GET /api/challenges/:id/leaderboard`
**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Success Response** (200 OK):
```json
{
  "challengeId": "uuid",
  "challengeName": "Tech Stock Challenge",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "techtrader",
      "portfolioValue": 58750.50,
      "totalReturn": 8750.50,
      "returnPercentage": 17.50
    },
    {
      "rank": 2,
      "userId": "uuid",
      "username": "codeinvestor",
      "portfolioValue": 56234.25,
      "totalReturn": 6234.25,
      "returnPercentage": 12.47
    }
  ],
  "total": 127,
  "limit": 100,
  "offset": 0
}
```

---

## Error Responses

All error responses follow a consistent format:

### Validation Error (400)
```json
{
  "error": "Validation Error",
  "details": [
    "Password must be at least 8 characters",
    "Email is required"
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Forbidden (403)
```json
{
  "error": "Access denied"
}
```

### Not Found (404)
```json
{
  "error": "Resource not found"
}
```

### Conflict (409)
```json
{
  "error": "Resource already exists"
}
```

### Rate Limited (429)
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

### Authentication Endpoints
- **Limit**: 5 requests per 15 minutes per IP
- **Applies to**: `/api/auth/register`, `/api/auth/login`
- **Response**: 429 Too Many Requests with `Retry-After` header

### General Endpoints
- **Limit**: 100 requests per 15 minutes per user
- **Applies to**: All other endpoints
- **Response**: 429 Too Many Requests

### Headers
All responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698153600
```

---

## Authentication Headers

For protected endpoints, include JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiry
- **Access Token**: 7 days
- **Refresh Token**: 30 days

### Refreshing Tokens
Use the refresh token to obtain a new access token before expiry (endpoint implementation pending).

---

## Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## Pagination

Endpoints supporting pagination use consistent parameters:

- `limit`: Number of results per page (default varies by endpoint)
- `offset`: Number of results to skip

Response includes:
```json
{
  "data": [...],
  "total": 542,
  "limit": 10,
  "offset": 0
}
```

---

## Date Formats

All dates use ISO 8601 format:
```
2025-10-21T17:30:00.000Z
```

---

**API Version**: 1.0.0
**Last Updated**: October 2025
