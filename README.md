# Stock Market Simulation & Trading Game

A full-stack gamified stock trading simulation platform that allows users to learn investing through paper trading with real market data, compete on leaderboards, and earn achievements—all without financial risk.

## Features

### Core Trading Features
- **Paper Trading**: Execute buy/sell orders with virtual money ($100,000 starting balance)
- **Real-time Market Data**: Live stock prices from Alpha Vantage with Yahoo Finance fallback
- **Portfolio Management**: Create and manage portfolios with real-time valuations
- **Transaction History**: View complete trade history with filtering options
- **Asset Holdings**: Track current positions with profit/loss calculations

### Gamification
- **Leaderboards**: Compete with other users on daily, weekly, monthly, and all-time rankings
- **Achievements System**: Unlock badges based on trading performance and milestones
- **Challenges**: Join time-bound trading challenges with specific goals

### Technical Features
- **JWT Authentication**: Secure user authentication with bcrypt password hashing
- **Redis Caching**: 5-minute cache for market data to optimize API usage
- **Rate Limiting**: Protection against API abuse
- **Responsive UI**: Dark mode support with modern, clean interface
- **Real-time Updates**: Live portfolio valuations and market data

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Caching**: Redis (ioredis)
- **Validation**: Zod schemas
- **Task Scheduling**: node-cron for background jobs
- **Logging**: Winston

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts for visualizations
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

### External APIs
- **Alpha Vantage**: Primary stock market data source
- **Yahoo Finance** (yfinance): Fallback when Alpha Vantage rate limits are reached
- **CoinGecko**: Cryptocurrency data (configured)

## Project Structure

```
stock-sim-trading/
├── backend/
│   ├── src/
│   │   ├── config/           # Database, Redis, Logger, Environment
│   │   ├── controllers/      # Route handlers (Auth, Portfolio, Trade, Market, Leaderboard, Achievement)
│   │   ├── middleware/       # Auth, Validation, Error handling, Rate limiting
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic layer
│   │   ├── jobs/             # Scheduled background jobs
│   │   ├── types/            # TypeScript type definitions
│   │   └── index.ts          # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Database seeding script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components (Dashboard, Market, Login, etc.)
│   │   ├── services/         # API client services
│   │   ├── context/          # Auth state management
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx           # Root application component
│   └── package.json
├── docs/                     # Additional documentation
└── README.md                 # This file
```

## Prerequisites

- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 14 or higher
- **Redis**: Latest stable version
- **npm** or **yarn**: Package manager
- **Alpha Vantage API Key**: Free at [alphavantage.co](https://www.alphavantage.co/support/#api-key)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stock-sim-trading
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the backend directory:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/stocksim?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="30d"

# API Keys
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Server Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Cache Configuration
MARKET_DATA_CACHE_TTL="300"
```

Initialize the database:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Test Account**:
  - Email: demo@example.com
  - Password: password123

## Database Schema

The application uses PostgreSQL with 10 main tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication credentials |
| `portfolios` | User portfolios with cash balances |
| `holdings` | Current asset positions (stocks/crypto) |
| `trades` | Complete trade history (buy/sell orders) |
| `market_data_cache` | Cached API responses for market data |
| `leaderboards` | User rankings by time period |
| `achievements` | Achievement definitions and requirements |
| `user_achievements` | User's earned achievements |
| `challenges` | Active trading challenges |
| `user_challenges` | User participation in challenges |

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for detailed schema information.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/logout` - Invalidate user session
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user information

### Portfolio Management
- `GET /api/portfolios` - Get all user portfolios
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios/:id` - Get portfolio with holdings
- `GET /api/portfolios/:id/value` - Calculate current total value
- `GET /api/portfolios/:id/performance` - Get performance metrics

### Trading
- `POST /api/trades/buy` - Execute buy order
- `POST /api/trades/sell` - Execute sell order
- `GET /api/trades/history` - Get filtered trade history
- `POST /api/trades/validate` - Validate trade before execution

### Market Data
- `GET /api/market/search` - Search stocks/crypto by symbol or name
- `GET /api/market/quote/:symbol` - Get current price quote
- `GET /api/market/historical/:symbol` - Get historical price data
- `GET /api/market/trending` - Get trending assets
- `GET /api/market/popular` - Get most traded assets on platform

### Leaderboards
- `GET /api/leaderboards/:period` - Get rankings (daily/weekly/monthly/all-time)
- `GET /api/leaderboards/user/:userId` - Get user's rank

### Achievements
- `GET /api/achievements` - List all available achievements
- `GET /api/achievements/user/:userId` - Get user's achievements

### Challenges
- `GET /api/challenges` - List active challenges
- `POST /api/challenges/:id/join` - Join a challenge
- `GET /api/challenges/user` - Get user's active challenges
- `GET /api/challenges/:id/leaderboard` - Get challenge rankings

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for detailed API reference.

## Key Features Explained

### Paper Trading System
Users start with $100,000 in virtual cash. All trades are executed at real market prices with the following validations:
- Sufficient cash balance for buy orders
- Sufficient holdings for sell orders
- Real-time price fetching at execution
- Automatic portfolio value updates

### Market Data Flow
1. **Request**: User requests stock price
2. **Redis Cache Check**: Check 5-minute cache (300s TTL)
3. **Database Cache Check**: Check 30-minute database cache
4. **Alpha Vantage API**: Primary data source
5. **Yahoo Finance Fallback**: If Alpha Vantage fails or rate-limited
6. **Cache Update**: Store in both Redis and database

### Background Jobs
Scheduled tasks running via node-cron:
- **Daily at Midnight**: Full leaderboard recalculation
- **Hourly (9 AM - 4 PM EST, Mon-Fri)**: Market hours leaderboard updates
- **Every 15 Minutes (Market Hours)**: Placeholder for market data refresh

### Authentication Flow
1. User registers with email/username/password
2. Password hashed with bcrypt (12 rounds)
3. Login returns JWT access token (7-day expiry) and refresh token (30-day expiry)
4. Protected routes validate JWT via middleware
5. Token includes userId for request context

## Development Workflow

This project follows Git Flow:
- **main**: Production-ready code
- **dev**: Development branch (current: dev)
- **feature/\***: Feature branches off dev

### Creating a Feature
```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: description"
git push origin feature/your-feature-name
```

## Available Scripts

### Backend
```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm run migrate      # Run Prisma migrations
npm run seed         # Seed database with sample data
npm run studio       # Open Prisma Studio (database GUI)
npm test             # Run Jest tests with coverage
npm run lint         # Run ESLint
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run Vitest tests
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | Access token expiry | 7d |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 30d |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key | Optional |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Backend server port | 3001 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `MARKET_DATA_CACHE_TTL` | Redis cache TTL in seconds | 300 (5min) |

## Security Features

- **Password Security**: bcrypt hashing with 12 salt rounds
- **JWT Tokens**: Signed tokens with expiry and refresh mechanism
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Rate Limiting**: Express rate limiter on auth endpoints
- **Input Validation**: Zod schemas on all endpoints
- **CORS**: Configured for specific frontend origin
- **Environment Variables**: Sensitive data not in code

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -d postgres -c "SELECT version();"

# Reset database
cd backend
npx prisma db push --force-reset
npm run seed
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Port Already in Use
```bash
# Windows - Find process on port 3001
netstat -ano | findstr ":3001"
taskkill //F //PID <PID>

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Alpha Vantage Rate Limit
The application automatically falls back to Yahoo Finance when Alpha Vantage rate limits are hit (5 requests/minute on the free tier). Consider upgrading to a paid plan for higher limits.

## Performance Considerations

- **Redis Caching**: Reduces API calls by 90%+ for frequently accessed stocks
- **Database Indexing**: Primary keys and foreign keys indexed via Prisma
- **Connection Pooling**: Prisma manages PostgreSQL connection pool
- **API Throttling**: Request queuing prevents rate limit errors (future enhancement)
- **Lazy Loading**: Frontend components load on demand

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

Test coverage includes:
- Unit tests for services
- Integration tests for API endpoints
- Component tests for React components

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Alpha Vantage** - Real-time and historical stock market data
- **Yahoo Finance** - Fallback market data source
- **CoinGecko** - Cryptocurrency data
- **Prisma** - Next-generation ORM
- **React Team** - Frontend framework
- **All Contributors** - Open-source community

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review API documentation for endpoint details

## Roadmap

Future enhancements under consideration:
- WebSocket support for real-time price updates
- Advanced charting with technical indicators
- Social trading features (follow users, copy trades)
- Mobile application (React Native)
- Options and futures trading simulation
- Portfolio analytics and insights
- News feed integration
- Educational content and tutorials

---

**Current Version**: 1.0.0
**Last Updated**: October 2025
**Status**: Active Development
