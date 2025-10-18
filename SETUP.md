# Stock Market Simulation - Setup Guide

This guide will help you set up and run the Stock Market Simulation & Trading Game on your local machine.

## Prerequisites

Make sure you have the following installed:

- **Node.js 18+** and npm (Download from [nodejs.org](https://nodejs.org/))
- **Docker Desktop** (Download from [docker.com](https://www.docker.com/products/docker-desktop/))
- **Git** (Download from [git-scm.com](https://git-scm.com/))

## Quick Start (Using Docker - Recommended)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd stock-sim-trading
```

### 2. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

Verify services are running:
```bash
docker-compose ps
```

### 3. Setup Backend

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys (optional for development):
```env
DATABASE_URL="postgresql://stocksim:password@localhost:5432/stocksim?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
REDIS_URL="redis://localhost:6379"
ALPHA_VANTAGE_API_KEY="your-api-key-here-optional"
```

Run Prisma migrations to create database tables:
```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:
```bash
npx prisma generate
```

Seed the database with sample data:
```bash
npm run seed
```

Start the backend development server:
```bash
npm run dev
```

The backend API should now be running on http://localhost:3001

### 4. Setup Frontend

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

The default `.env` should work:
```env
VITE_API_URL=http://localhost:3001/api
```

Start the frontend development server:
```bash
npm run dev
```

The frontend should now be running on http://localhost:3000

### 5. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

### 6. Login with Demo Account

Use these credentials to login:
- **Email**: demo@stocksim.com
- **Password**: Demo123!

Additional demo accounts:
- pro@stocksim.com / Demo123!
- crypto@stocksim.com / Demo123!

## Manual Setup (Without Docker)

If you prefer not to use Docker, you'll need to install PostgreSQL and Redis manually.

### Install PostgreSQL

**Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux**:
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

Create database:
```sql
CREATE DATABASE stocksim;
CREATE USER stocksim WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE stocksim TO stocksim;
```

### Install Redis

**Windows**: Download from [redis.io](https://redis.io/download/) or use WSL

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

Then follow steps 3-6 from the Quick Start guide above.

## Troubleshooting

### Port Already in Use

If ports 3000, 3001, 5432, or 6379 are already in use:

**Check what's using the port** (Windows):
```bash
netstat -ano | findstr :3001
```

**Check what's using the port** (macOS/Linux):
```bash
lsof -i :3001
```

**Kill the process** or change the port in `.env` files.

### Database Connection Errors

1. Make sure Docker containers are running:
   ```bash
   docker-compose ps
   ```

2. Check container logs:
   ```bash
   docker-compose logs postgres
   ```

3. Restart containers:
   ```bash
   docker-compose restart postgres redis
   ```

### Prisma Errors

If you encounter Prisma errors:

1. Reset the database:
   ```bash
   npx prisma migrate reset
   ```

2. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Run migrations again:
   ```bash
   npx prisma migrate dev
   ```

### Frontend Build Errors

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

### API Connection Errors

1. Make sure backend is running on port 3001
2. Check `VITE_API_URL` in frontend `.env`
3. Check browser console for CORS errors
4. Verify backend is allowing requests from `http://localhost:3000`

## Development Tools

### Prisma Studio

View and edit your database with a GUI:
```bash
cd backend
npm run studio
```

Opens Prisma Studio at http://localhost:5555

### Database Logs

View PostgreSQL logs:
```bash
docker-compose logs -f postgres
```

View Redis logs:
```bash
docker-compose logs -f redis
```

### API Testing

Use the API health check endpoint:
```bash
curl http://localhost:3001/api/health
```

Test authentication:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@stocksim.com","password":"Demo123!"}'
```

## Building for Production

### Backend

Build TypeScript:
```bash
cd backend
npm run build
```

Run production server:
```bash
npm start
```

### Frontend

Build production bundle:
```bash
cd frontend
npm run build
```

Preview production build:
```bash
npm run preview
```

### Docker Production Build

Build all services:
```bash
docker-compose -f docker-compose.yml up --build
```

## Next Steps

After successful setup:

1. Explore the **Dashboard** to see your portfolio
2. Check the **API Documentation** in README.md
3. Try making trades with demo data
4. Review the code structure to understand the architecture
5. Start customizing features to your needs

## Getting Help

- Check the main [README.md](README.md) for API documentation
- Review the [database schema](backend/prisma/schema.prisma)
- Look at example implementations in the codebase
- Open an issue on GitHub if you encounter bugs

## Important Notes

- The demo uses **mock market data** when no Alpha Vantage API key is provided
- All trades are **paper trading** - no real money involved
- Database is reset when running `npm run seed`
- Keep your JWT secrets secure in production
- Never commit `.env` files to version control

Happy Trading! 📈
