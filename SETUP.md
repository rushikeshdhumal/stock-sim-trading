# Stock Market Simulation - Setup Guide

This guide provides detailed step-by-step instructions for setting up the Stock Market Simulation & Trading Game application on your local machine.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installing Prerequisites](#installing-prerequisites)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Verification](#verification)
7. [Common Issues](#common-issues)
8. [Production Deployment](#production-deployment)

---

## System Requirements

### Minimum Requirements
- **CPU**: 2+ cores
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Software Requirements
- Node.js 18.x or higher
- PostgreSQL 14.x or higher (Docker recommended)
- Redis 6.x or higher (Docker recommended)
- Docker Desktop (for running PostgreSQL and Redis)
- Git

---

## Installing Prerequisites

### 1. Node.js Installation

#### Windows
1. Download the LTS installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the prompts
3. Verify installation:
```bash
node --version
npm --version
```

#### macOS
Using Homebrew:
```bash
brew install node@18
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2. PostgreSQL Installation

#### Windows
1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer (recommended version: 14 or higher)
3. During installation:
   - Set password for postgres user (remember this!)
   - Default port: 5432
   - Install pgAdmin 4 (recommended for database management)

Verify installation:
```bash
psql --version
```

If `psql` is not found, add to PATH:
- Default location: `C:\Program Files\PostgreSQL\<version>\bin`

#### macOS
Using Homebrew:
```bash
brew install postgresql@14
brew services start postgresql@14
psql --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
psql --version
```

### 3. Docker Desktop Installation (Recommended)

#### Windows
1. Download Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Run the installer
3. Start Docker Desktop
4. Verify installation:
```bash
docker --version
docker-compose --version
```

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from docker.com
# Start Docker Desktop from Applications
docker --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 4. Redis Installation (Optional - Docker is Recommended)

**Recommended**: Use Docker Compose (see Database Setup section)

If you prefer manual installation:

#### Windows
1. Download Redis for Windows from [github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
2. Extract and run `redis-server.exe`

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

Verify Redis:
```bash
redis-cli ping
# Should return: PONG
```

### 5. Git Installation

#### Windows
Download from [git-scm.com](https://git-scm.com/download/win) and run the installer.

#### macOS
```bash
brew install git
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install git
```

Verify:
```bash
git --version
```

---

## Database Setup

### Option A: Using Docker Compose (Recommended)

This is the easiest and recommended method. Docker Compose will set up both PostgreSQL and Redis for you.

```bash
# From project root directory
docker-compose up -d
```

This command:
- Downloads PostgreSQL and Redis images (if not already present)
- Starts both services in the background
- Creates persistent volumes for data storage
- Configures networking between containers

**Verify services are running:**
```bash
docker ps

# Should show containers named: stock-sim-trading-postgres-1 and stock-sim-trading-redis-1
```

**Test database connection:**
```bash
# Windows PowerShell
$env:PGPASSWORD="password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d stocksim -c "SELECT version();"

# macOS/Linux
PGPASSWORD=password psql -h localhost -U postgres -d stocksim -c "SELECT version();"
```

**Test Redis connection:**
```bash
redis-cli ping
# Should return: PONG
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs postgres
docker-compose logs redis
```

### Option B: Manual PostgreSQL Setup

If you prefer to install PostgreSQL manually instead of using Docker:

### 1. Create PostgreSQL Database

#### Method 1: Using psql (Command Line)

**Windows** (PowerShell):
```powershell
# Set password environment variable
$env:PGPASSWORD="your_postgres_password"

# Connect to PostgreSQL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres

# Or if psql is in PATH:
psql -U postgres -d postgres
```

**macOS/Linux**:
```bash
sudo -u postgres psql
```

Once in psql, run:
```sql
-- Create database
CREATE DATABASE stocksim;

-- Create user (optional - for production)
CREATE USER stocksim WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stocksim TO stocksim;

-- Exit
\q
```

#### Method 2: Using pgAdmin 4

1. Open pgAdmin 4
2. Connect to PostgreSQL server (localhost)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `stocksim`
5. Owner: `postgres` (or create a new user)
6. Click "Save"

### 2. Verify Database Connection

**Windows**:
```powershell
$env:PGPASSWORD="password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d stocksim -c "SELECT version();"
```

**macOS/Linux**:
```bash
psql -U postgres -d stocksim -c "SELECT version();"
```

You should see PostgreSQL version information.

---

## Backend Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stock-sim-trading/backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all backend dependencies including:
- Express.js
- Prisma
- JWT libraries
- Redis client
- And more...

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# macOS/Linux
touch .env
```

Edit `.env` and add the following (adjust values as needed):

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/stocksim?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-token-secret-also-change-this-min-32-chars"
JWT_REFRESH_EXPIRES_IN="30d"

# API Keys
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"
# Get free key at: https://www.alphavantage.co/support/#api-key

FINNHUB_API_KEY="your-finnhub-api-key"
# Get free key at: https://finnhub.io/register

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Server Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Cache Configuration
MARKET_DATA_CACHE_TTL="1800"
```

**Important Notes:**
- Replace `password` with your actual PostgreSQL password (if using Docker, default is `password`)
- Generate strong random secrets for JWT_SECRET and JWT_REFRESH_SECRET
- Get a free Alpha Vantage API key from [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- Get a free Finnhub API key from [finnhub.io](https://finnhub.io/register)
- FRONTEND_URL should match your Vite dev server (default: port 5173)

### 4. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your schema.

### 5. Initialize Database Schema

**Option A: Push schema without migrations** (recommended for development):
```bash
npx prisma db push
```

**Option B: Create and run migrations**:
```bash
npm run migrate
```

Verify schema in pgAdmin or using:
```bash
npx prisma studio
```
This opens a web interface at http://localhost:5555 to view your database.

### 6. Seed the Database

Populate the database with sample data:

```bash
npm run seed
npm run seed:leaderboard
```

This creates:
- 3 demo users (demo@example.com, user1@example.com, user2@example.com)
- Initial portfolios with $100,000 cash
- Sample achievements
- Sample challenges
- Test trades
- Leaderboard rankings for all time periods

**Demo Account Credentials:**
- Email: `demo@example.com`
- Password: `password123`

### 7. Start the Backend Server

```bash
npm run dev
```

Expected output:
```
[INFO] Redis client connected
[INFO] Database connected successfully
[INFO] Scheduled jobs initialized successfully
[INFO] Server running on port 3001
[INFO] Environment: development
```

The backend API is now running at: **http://localhost:3001**

### 8. Test Backend API

Open a new terminal and test:

```bash
# Windows PowerShell
curl http://localhost:3001/api/market/trending

# macOS/Linux
curl http://localhost:3001/api/market/trending
```

You should receive a JSON response with trending stocks.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
# Or from root: cd stock-sim-trading/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- And more...

### 3. Configure Environment (Optional)

The frontend uses the default backend URL `http://localhost:3001`. If your backend runs on a different port, create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

### 4. Start the Frontend Server

```bash
npm run dev
```

Expected output:
```
  VITE v7.1.7  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

The frontend is now running at: **http://localhost:5173**

---

## Verification

### 1. Open the Application

Navigate to **http://localhost:5173** in your browser.

### 2. Login with Demo Account

- Email: `demo@example.com`
- Password: `password123`

### 3. Test Core Features

#### a) View Dashboard
- Should display portfolio value ($100,000 initial)
- Holdings list (initially empty)
- Recent transactions toggle

#### b) Search and Buy Stock
1. Click "Market" in navigation
2. Search for a stock (e.g., "AAPL")
3. Click on a result
4. Enter quantity (e.g., 10 shares)
5. Click "Buy"
6. Verify success toast notification

#### c) View Transaction
1. Return to Dashboard
2. Click "View Transactions"
3. Verify your purchase appears in the list

#### d) Check Holdings
- Your purchased stock should appear in holdings
- Cash balance should be reduced
- Total portfolio value should reflect current stock price

#### e) View Leaderboard
- Click "Leaderboard" in navigation
- Should show rankings by period
- Your account should appear in the list

#### f) View Achievements
- Click "Achievements" in navigation
- Should display available achievements
- Some may already be unlocked

### 4. Check Backend Logs

In the backend terminal, you should see:
```
[INFO] GET /api/portfolios - 200 - User: <userId>
[INFO] POST /api/trades/buy - 200 - User: <userId>
[INFO] GET /api/trades/history - 200 - User: <userId>
```

### 5. Verify Database Changes

**Using Prisma Studio:**
```bash
cd backend
npx prisma studio
```

Navigate to http://localhost:5555 and check:
- `trades` table: Your new trade should be there
- `holdings` table: Your stock holding should appear
- `portfolios` table: Cash balance should be updated

**Using pgAdmin 4:**
```sql
-- View recent trades
SELECT * FROM trades ORDER BY "executedAt" DESC LIMIT 5;

-- View holdings
SELECT * FROM holdings WHERE quantity > 0;

-- View portfolio balances
SELECT id, "userId", "cashBalance" FROM portfolios;
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution (Windows)**:
```bash
netstat -ano | findstr ":3001"
taskkill //F //PID <PID>
```

**Solution (macOS/Linux)**:
```bash
lsof -ti:3001 | xargs kill -9
```

### Issue 2: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Verify PostgreSQL is running:
   - Windows: Check Services (`services.msc`)
   - macOS: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Check DATABASE_URL in `.env`:
   - Correct format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
   - Verify password is correct
   - Ensure database `stocksim` exists

3. Test connection manually:
```bash
psql -U postgres -d stocksim -c "SELECT 1;"
```

### Issue 3: Redis Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
1. **If using Docker** (recommended):
```bash
# Check if Docker Desktop is running
docker ps

# Check if Redis container is running
docker ps | grep redis

# Start Docker services
docker-compose up -d redis

# Or restart all services
docker-compose restart
```

2. **If using manual Redis installation**:
   - Windows: Run `redis-server.exe`
   - macOS: `brew services start redis`
   - Linux: `sudo systemctl start redis-server`

3. Test connection:
```bash
redis-cli ping
# Should return: PONG
```

4. Check Redis logs if issues persist:
```bash
# Docker
docker-compose logs redis

# Manual installation
# Windows: Check redis-server.exe output
# Linux: sudo journalctl -u redis-server
```

### Issue 4: Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npx prisma generate
npm install
```

### Issue 5: Environment Variables Not Loaded

**Error**: `Invalid environment variables`

**Solutions**:
1. Verify `.env` file exists in `backend/` directory
2. Check for syntax errors (no spaces around `=`)
3. Ensure all required variables are set
4. Restart the backend server after changes

### Issue 6: Alpha Vantage API Key Invalid

**Error**: Market data not loading

**Solutions**:
1. Get a free API key: https://www.alphavantage.co/support/#api-key
2. Add to `.env`: `ALPHA_VANTAGE_API_KEY="your-key"`
3. Restart backend
4. The app will fall back to Yahoo Finance if needed

### Issue 7: CORS Errors in Browser

**Error**: `Access-Control-Allow-Origin` errors

**Solutions**:
1. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Default should be: `http://localhost:5173`
3. If using a different port, update accordingly
4. Restart backend after changes

### Issue 8: TypeScript Compilation Errors

**Error**: `TSError: Unable to compile TypeScript`

**Solutions**:
```bash
# Backend
cd backend
npm install
npx tsc --noEmit  # Check for errors

# Frontend
cd frontend
npm install
npm run build  # Check for errors
```

### Issue 9: Seed Script Fails

**Error**: Database seeding fails

**Solutions**:
1. Reset database:
```bash
npx prisma db push --force-reset
```

2. Re-run seed:
```bash
npm run seed
```

3. Check for existing data conflicts in pgAdmin

---

## Production Deployment

### 1. Environment Configuration

Create production `.env`:
```env
NODE_ENV="production"
DATABASE_URL="<production-database-url>"
REDIS_URL="<production-redis-url>"
JWT_SECRET="<strong-random-secret-min-32-chars>"
JWT_REFRESH_SECRET="<strong-random-refresh-secret>"
ALPHA_VANTAGE_API_KEY="<your-api-key>"
FRONTEND_URL="https://your-domain.com"
```

### 2. Database Migration

```bash
cd backend
npm run migrate:deploy
```

### 3. Build Backend

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 4. Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized production build in `dist/` folder.

### 5. Start Production Server

```bash
cd backend
npm start
```

### 6. Deployment Options

#### Option A: Traditional VPS (DigitalOcean, Linode, AWS EC2)
1. Set up Ubuntu server
2. Install Node.js, PostgreSQL, Redis
3. Clone repository
4. Configure environment variables
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name stock-sim-backend
pm2 startup
pm2 save
```

#### Option B: Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option C: Platform-as-a-Service
- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Railway PostgreSQL, Neon, Supabase
- **Redis**: Upstash, Redis Cloud

### 7. Security Checklist

- [ ] Strong JWT secrets (min 32 characters, random)
- [ ] Secure database password
- [ ] HTTPS/SSL certificates configured
- [ ] CORS limited to specific domain
- [ ] Rate limiting enabled
- [ ] Environment variables not in code
- [ ] Database backups configured
- [ ] Firewall rules configured
- [ ] Regular security updates

---

## Additional Resources

### Documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)

### Tools
- **pgAdmin 4**: PostgreSQL database management
- **Prisma Studio**: Visual database editor
- **RedisInsight**: Redis visualization tool
- **Postman**: API testing
- **VS Code Extensions**:
  - Prisma (syntax highlighting)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Getting Help
- Check [README.md](README.md) for overview
- Review [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for API details
- See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for schema info
- Open GitHub issue for bugs

---

**Setup Complete!** You should now have a fully functional stock trading simulation platform running locally.
