# Startup Instructions

## Prerequisites
- Node.js (v16 or higher)
- Docker Desktop
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
- `ALPHA_VANTAGE_API_KEY` (optional)
- `FINNHUB_API_KEY` (optional)
- Other keys use defaults from .env.example

### 4. Run Database Migrations
```bash
cd backend
npx prisma migrate dev
```

### 5. Start Development Servers
```bash
# Backend (from backend directory)
npm run dev

# Frontend (in a new terminal, from frontend directory)
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

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
- App works without API keys (uses mock data)
- Add API keys in `backend/.env` for real market data
