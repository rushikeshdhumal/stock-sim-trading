# Stock Market Simulation & Trading Game

A full-stack gamified stock trading simulation platform that allows users to learn investing through paper trading, compete on leaderboards, and earn achievements—all without financial risk.

## Features

- **Paper Trading**: Execute buy/sell orders with virtual money using real market data
- **Real-time Market Data**: Live stock and cryptocurrency prices from Alpha Vantage and CoinGecko
- **Portfolio Management**: Track multiple portfolios with real-time valuations
- **Leaderboards**: Compete with other users on daily, weekly, monthly, and all-time rankings
- **Achievements System**: Unlock badges and achievements based on trading performance
- **Challenges**: Join time-bound trading challenges with specific goals
- **Modern UI**: Responsive design with dark mode support and real-time updates

## Tech Stack

### Backend
- **Framework**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Caching**: Redis for API response caching
- **Validation**: Zod for request validation
- **Task Scheduling**: Node-cron for background jobs

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Charts**: Recharts for stock visualizations
- **Routing**: React Router

### External APIs
- Alpha Vantage (stock data)
- CoinGecko (cryptocurrency data)

## Project Structure

```
stock-sim-trading/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── jobs/           # Background jobs
│   │   └── index.ts        # Entry point
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Root component
│   └── package.json
└── docker/                 # Docker configuration
    └── docker-compose.yml
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- PostgreSQL 14+ (or use Docker)
- Redis (or use Docker)

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://stocksim:password@localhost:5432/stocksim?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# API Keys
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-sim-trading
```

2. Start all services with Docker Compose:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
cd backend
npm run migrate
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see `.env.example`)

4. Run database migrations:
```bash
npm run migrate
```

5. Seed the database:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Portfolio Management

- `GET /api/portfolios` - Get user's portfolios
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios/:id` - Get portfolio details with holdings
- `GET /api/portfolios/:id/value` - Calculate current portfolio value
- `GET /api/portfolios/:id/performance` - Get portfolio performance metrics

### Trading

- `POST /api/trades/buy` - Execute buy order
- `POST /api/trades/sell` - Execute sell order
- `GET /api/trades/history` - Get trade history with filters
- `POST /api/trades/validate` - Validate trade before execution

### Market Data

- `GET /api/market/search` - Search for stocks/crypto by symbol or name
- `GET /api/market/quote/:symbol` - Get current quote for a symbol
- `GET /api/market/historical/:symbol` - Get historical price data
- `GET /api/market/trending` - Get trending stocks/crypto
- `GET /api/market/popular` - Get most traded assets on platform

### Leaderboards

- `GET /api/leaderboards/:period` - Get leaderboard (daily/weekly/monthly/all-time)
- `GET /api/leaderboards/user/:userId` - Get user's rank across periods

### Achievements

- `GET /api/achievements` - List all achievements
- `GET /api/achievements/user/:userId` - Get user's earned achievements

### Challenges

- `GET /api/challenges` - List active challenges
- `POST /api/challenges/:id/join` - Join a challenge
- `GET /api/challenges/user` - Get user's active challenges
- `GET /api/challenges/:id/leaderboard` - Get challenge-specific leaderboard

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `portfolios` - User portfolios
- `holdings` - Current asset holdings
- `trades` - Trade history
- `market_data_cache` - Cached market data
- `leaderboards` - User rankings by period
- `achievements` - Achievement definitions
- `user_achievements` - Earned achievements
- `challenges` - Active challenges
- `user_challenges` - User challenge participation

See [prisma/schema.prisma](backend/prisma/schema.prisma) for the complete schema.

## Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Development Workflow

This project uses a Git Flow workflow:

- `main` - Production-ready code
- `dev` - Development branch (default)
- `feature/*` - Feature branches

### Creating a New Feature

1. Create a feature branch from dev:
```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push and create a pull request to dev:
```bash
git push origin feature/your-feature-name
```

## Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration

Ensure all production environment variables are set:
- Strong JWT secret
- Production database URL
- API keys for external services
- Redis URL
- CORS origins

## Security Best Practices

- Passwords hashed with bcrypt (12 rounds)
- JWT with refresh tokens
- Rate limiting on authentication endpoints
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- CORS properly configured
- Environment variables for sensitive data

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Alpha Vantage for market data API
- CoinGecko for cryptocurrency data
- All open-source contributors
