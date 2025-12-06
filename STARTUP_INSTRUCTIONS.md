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

### 4. Setup Database Schema
```bash
cd backend
npx prisma db push
```
**Note:** If `npx prisma migrate dev` fails with shadow database errors, use `npx prisma db push` instead. This syncs the schema directly without requiring a shadow database.

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
- Add API keys in `backend/.env` for real market data

**Prisma migration errors (P3014/P1003):**
- If `npx prisma migrate dev` fails with shadow database permission errors:
  - Use `npx prisma db push` instead (development workaround)
  - The error occurs even with correct permissions due to Prisma caching issues
  - `db push` syncs schema directly without needing a shadow database
  - For production, use `npx prisma migrate deploy` which also skips shadow database

**Port already in use (EADDRINUSE):**
- If the backend fails to start with "address already in use :::3001":
  ```bash
  # Find the process using port 3001
  netstat -ano | findstr :3001

  # Kill the process (replace <PID> with the actual process ID from above)
  taskkill /F /PID <PID>
  ```
  - Then restart the dev server with `npm run dev`
