# Startup Instructions

## Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (running)
- Git

## Quick Start

### 1. Start Docker Services
```bash
docker-compose up -d
```
This starts PostgreSQL and Redis containers.

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 3. Setup Environment Variables
```bash
# Backend: Copy .env.example to .env
cd backend
cp .env.example .env
```
Edit `backend/.env` and add your API keys:
- `ALPHA_VANTAGE_API_KEY` (required) - Get free at https://www.alphavantage.co/support/#api-key
- `FINNHUB_API_KEY` (optional but recommended) - Get free at https://finnhub.io/register
- Other keys use defaults from .env.example

### 4. Setup Database Schema
```bash
cd backend
npx prisma db push
npm run seed
npm run seed:leaderboard
```
**Note:** If `npx prisma migrate dev` fails with shadow database errors, use `npx prisma db push` instead. This syncs the schema directly without requiring a shadow database.

The seed commands will:
- Create demo users and portfolios
- Create sample achievements
- Populate leaderboard with synthetic data

### 5. Start Development Servers
```bash
# Backend (from backend directory, in a new terminal)
npm run dev                 # Port 3001

# Frontend (in a new terminal, from frontend directory)
npm run dev                 # Port 5173
```

**Note**: You need 2 terminals running simultaneously for full functionality:
1. Backend Node.js API (port 3001)
2. Frontend React dev server (port 5173)

### 6. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)

**Demo Account:**
- Email: demo@example.com
- Password: password123

## Stopping the Application

### Stop Development Servers
Press `Ctrl+C` in each terminal running the dev servers.

### Stop Docker Services
```bash
docker-compose down
```

## Troubleshooting

**Docker containers not starting:**
- Ensure Docker Desktop is running
- Check port conflicts: 5432 (PostgreSQL), 6379 (Redis)

**Database connection errors:**
- Wait 10-15 seconds after `docker-compose up` for DB initialization
- Verify containers are running: `docker-compose ps`

**API rate limits:**
- Add API keys in `backend/.env` for real market data
- Alpha Vantage: 5 requests/minute (free tier)
- Finnhub: 60 requests/minute (free tier)
- System automatically queues requests to respect rate limits

**Prisma migration errors (P3014/P1003):**
- If `npx prisma migrate dev` fails with shadow database permission errors:
  - Use `npx prisma db push` instead (development workaround)
  - The error occurs even with correct permissions due to Prisma caching issues
  - `db push` syncs schema directly without needing a shadow database
  - For production, use `npx prisma migrate deploy` which also skips shadow database

**Port already in use (EADDRINUSE):**
- If the backend fails to start with "address already in use :::3001":
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /F /PID <PID>

  # macOS/Linux
  lsof -ti:3001 | xargs kill -9
  ```
  - Then restart the dev server with `npm run dev`

**Redis connection refused:**
- Ensure Docker Desktop is running
- Run `docker-compose up -d` to start Redis
- Check Redis status: `docker ps | grep redis`
- Test connection: `redis-cli ping` (should return PONG)
