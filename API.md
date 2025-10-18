# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

Create a new user account.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "startingBalance": 100000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "message": "User registered successfully"
}
```

### Login

Authenticate and receive tokens.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "message": "Login successful"
}
```

### Get Current User

Get the authenticated user's profile.

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "startingBalance": 100000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile

Update user profile information.

**Endpoint**: `PUT /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

### Logout

Logout the current user.

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <token>`

---

## Portfolios

### Get All Portfolios

Get all portfolios for the authenticated user.

**Endpoint**: `GET /portfolios`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Main Portfolio",
      "cashBalance": 85000.00,
      "totalValue": 115000.00,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Portfolio by ID

Get detailed portfolio information with holdings.

**Endpoint**: `GET /portfolios/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Main Portfolio",
    "cashBalance": 85000.00,
    "totalValue": 115000.00,
    "holdings": [
      {
        "id": "uuid",
        "symbol": "AAPL",
        "assetType": "STOCK",
        "quantity": 50,
        "averageCost": 175.00,
        "currentPrice": 178.25,
        "currentValue": 8912.50,
        "profitLoss": 162.50,
        "profitLossPercentage": 1.86
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Portfolio

Create a new portfolio.

**Endpoint**: `POST /portfolios`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Growth Portfolio",
  "initialBalance": 50000
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Growth Portfolio",
    "cashBalance": 50000.00,
    "totalValue": 50000.00,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Portfolio created successfully"
}
```

### Get Portfolio Value

Calculate current total portfolio value.

**Endpoint**: `GET /portfolios/:id/value`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "portfolioId": "uuid",
    "totalValue": 115000.00
  }
}
```

### Get Portfolio Performance

Get performance metrics for a portfolio.

**Endpoint**: `GET /portfolios/:id/performance`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "portfolioId": "uuid",
    "currentValue": 115000.00,
    "cashBalance": 85000.00,
    "totalReturn": 15000.00,
    "totalReturnPercentage": 15.00,
    "totalInvested": 30000.00,
    "totalTrades": 5,
    "holdingsCount": 3
  }
}
```

---

## Trading

### Execute Buy Order

Buy stocks or crypto.

**Endpoint**: `POST /trades/buy`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "assetType": "STOCK",
  "quantity": 10
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "trade": {
      "id": "uuid",
      "symbol": "AAPL",
      "assetType": "STOCK",
      "tradeType": "BUY",
      "quantity": 10,
      "price": 178.25,
      "totalValue": 1782.50,
      "executedAt": "2024-01-01T00:00:00.000Z"
    },
    "portfolio": {
      "cashBalance": 83217.50,
      "totalValue": 116782.50
    }
  },
  "message": "Buy order executed successfully"
}
```

### Execute Sell Order

Sell stocks or crypto.

**Endpoint**: `POST /trades/sell`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "portfolioId": "uuid",
  "symbol": "AAPL",
  "assetType": "STOCK",
  "quantity": 5
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "trade": {
      "id": "uuid",
      "symbol": "AAPL",
      "assetType": "STOCK",
      "tradeType": "SELL",
      "quantity": 5,
      "price": 178.25,
      "totalValue": 891.25,
      "executedAt": "2024-01-01T00:00:00.000Z"
    },
    "portfolio": {
      "cashBalance": 84108.75,
      "totalValue": 115891.25
    }
  },
  "message": "Sell order executed successfully"
}
```

### Get Trade History

Get trade history for a portfolio.

**Endpoint**: `GET /trades/history`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `portfolioId` (required): Portfolio UUID
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `symbol` (optional): Filter by symbol
- `tradeType` (optional): Filter by BUY or SELL

**Example**: `GET /trades/history?portfolioId=uuid&limit=20&symbol=AAPL`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "uuid",
        "portfolioId": "uuid",
        "symbol": "AAPL",
        "assetType": "STOCK",
        "tradeType": "BUY",
        "quantity": 10,
        "price": 178.25,
        "totalValue": 1782.50,
        "executedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 5
  }
}
```

---

## Market Data

### Search Assets

Search for stocks or cryptocurrency.

**Endpoint**: `GET /market/search`

**Query Parameters**:
- `q` (required): Search query
- `type` (optional): 'stock', 'crypto', or 'all' (default: 'all')

**Example**: `GET /market/search?q=AAPL&type=stock`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "assetType": "STOCK",
      "currentPrice": 178.25,
      "change24h": 2.15
    }
  ]
}
```

### Get Quote

Get current quote for a symbol.

**Endpoint**: `GET /market/quote/:symbol`

**Example**: `GET /market/quote/AAPL`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "assetType": "STOCK",
    "currentPrice": 178.25,
    "change24h": 2.15,
    "changePercentage": 1.22,
    "volume": 75000000,
    "marketCap": 2800000000000,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Trending Assets

Get trending stocks and crypto.

**Endpoint**: `GET /market/trending`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "assetType": "STOCK",
      "currentPrice": 178.25,
      "change24h": 2.15,
      "changePercentage": 1.22,
      "volume": 75000000
    }
  ]
}
```

### Get Popular Assets

Get most traded assets on the platform.

**Endpoint**: `GET /market/popular`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "assetType": "STOCK",
      "currentPrice": 178.25,
      "change24h": 2.15,
      "changePercentage": 1.22
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional details
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Example Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Trading**: 20 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## Health Check

Check API status.

**Endpoint**: `GET /api/health`

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```
