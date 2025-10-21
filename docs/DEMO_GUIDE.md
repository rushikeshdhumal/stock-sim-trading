# Demo Guide - 5-Minute Presentation

Complete guide for presenting the Stock Market Simulation & Trading Game in a 5-minute live demonstration.

**Team Size**: 4 people
**Duration**: 5 minutes
**Focus**: Application functionality and database interactions

---

## Table of Contents

1. [Setup Checklist](#setup-checklist)
2. [Team Roles](#team-roles)
3. [Presentation Script](#presentation-script)
4. [Database Queries](#database-queries)
5. [pgAdmin Setup](#pgadmin-setup)
6. [Troubleshooting](#troubleshooting)

---

## Setup Checklist

### Before the Demo

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] PostgreSQL running and accessible
- [ ] Redis running
- [ ] pgAdmin 4 installed and connected to database
- [ ] Demo account ready (demo@example.com / password123)
- [ ] Browser with application open
- [ ] pgAdmin with database connected
- [ ] Pre-loaded SQL queries in pgAdmin
- [ ] Test the complete demo flow once

### Technical Requirements
- Laptop with screen sharing capability
- Stable internet connection (for Alpha Vantage API)
- PostgreSQL database seeded with sample data
- All services running without errors

### Demo Account
- Email: `demo@example.com`
- Password: `password123`
- Starting balance: $100,000

---

## Team Roles

### Person 1: Introduction & Authentication (1 min)
**Responsibilities**:
- Project overview
- User registration/login demonstration
- Explain authentication system

**Screens to Show**:
- Login page
- Registration form
- Dashboard after login

---

### Person 2: Trading & Market Data (1.5 min)
**Responsibilities**:
- Stock search and quote retrieval
- Execute buy order
- Show transaction in database

**Screens to Show**:
- Market search page
- Stock details
- Buy order confirmation
- pgAdmin showing trades table

---

### Person 3: Portfolio Management (1.5 min)
**Responsibilities**:
- Portfolio overview
- Holdings display
- Transaction history
- Real-time value calculation

**Screens to Show**:
- Dashboard with holdings
- Transaction history
- pgAdmin showing holdings and portfolios tables

---

### Person 4: Gamification & Wrap-up (1 min)
**Responsibilities**:
- Leaderboards
- Achievements
- Conclusion and Q&A

**Screens to Show**:
- Leaderboard page
- Achievements page
- pgAdmin showing leaderboards and achievements tables

---

## Presentation Script

### Person 1: Introduction & Authentication (0:00 - 1:00)

**[Screen: Login Page]**

> "Good afternoon, everyone. Today we're presenting our Stock Market Simulation and Trading Game - a full-stack web application that allows users to learn stock trading with zero financial risk.
>
> Our platform uses real market data but virtual money, making it perfect for beginners who want to practice trading before investing real capital.
>
> Let me start by showing you our authentication system."

**[Action: Navigate to registration page]**

> "Users can create an account with just a username, email, and secure password. Our backend validates all inputs using Zod schemas and hashes passwords with bcrypt before storing them."

**[Action: Show demo account login]**

> "I'll log in with our demo account. Upon successful authentication, the backend generates a JWT token that's valid for 7 days and stores it securely."

**[Action: Login with demo@example.com / password123]**

> "And we're in! The authentication state is managed using Zustand on the frontend, and all subsequent API calls include the JWT Bearer token in headers."

**[Hand off to Person 2]**

---

### Person 2: Trading & Market Data (1:00 - 2:30)

**[Screen: Dashboard → Navigate to Market]**

> "Thanks! Now let me show you the core feature - trading stocks with real market data.
>
> Let's search for a stock. I'll search for Apple."

**[Action: Type 'AAPL' in search bar]**

> "Our search functionality queries the Alpha Vantage API, with Yahoo Finance as a fallback if we hit rate limits. Results are cached in Redis for 5 minutes and in PostgreSQL for 30 minutes to optimize performance."

**[Action: Click on AAPL result to view details]**

> "Here we can see Apple's current price, pulled live from the market. The application fetches real-time quotes through our multi-tier caching system: Redis first, then database cache, then external API.
>
> Let me buy 10 shares."

**[Action: Enter quantity: 10, click Buy button]**

> "When I click Buy, the backend validates that I have sufficient cash, fetches the current market price, executes the trade, and updates both my portfolio and holdings in one atomic database transaction."

**[Screen: Switch to pgAdmin]**

> "Let's verify this in the database. Here in the trades table, you can see the trade we just executed."

**[Action: Run pre-loaded query to show recent trade]**

```sql
SELECT * FROM trades ORDER BY executed_at DESC LIMIT 1;
```

> "Notice it captured the symbol, trade type, quantity, execution price, and timestamp. The total value was calculated as quantity times price, and our cash balance was automatically reduced."

**[Hand off to Person 3]**

---

### Person 3: Portfolio Management (2:30 - 4:00)

**[Screen: Navigate back to Dashboard]**

> "Excellent! Now let me show you how we track portfolio performance.
>
> On the dashboard, you can see the portfolio overview showing our total value, which is cash balance plus the current market value of all holdings."

**[Action: Point to portfolio summary section]**

> "This portfolio value is calculated in real-time by fetching current prices for each holding and multiplying by quantity. Our backend service does this efficiently by batching price requests and leveraging the cache."

**[Action: Scroll to holdings section]**

> "Here are our current holdings. Notice it shows the Apple shares we just bought - 10 shares at the price we paid, plus the current market value and our profit or loss."

**[Screen: Switch to pgAdmin]**

> "Let's look at the holdings table in the database."

**[Action: Run pre-loaded query]**

```sql
SELECT
  h.symbol,
  h.quantity,
  h.average_cost,
  h.created_at,
  h.updated_at
FROM holdings h
WHERE h.portfolio_id IN (
  SELECT id FROM portfolios WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@example.com'
  )
)
AND h.quantity > 0;
```

> "The holdings table maintains a running record of our positions. The average_cost field is particularly important - when we buy more of the same stock, the system calculates a new weighted average."

**[Action: Navigate back to frontend, click 'View Transactions']**

> "Users can also view their complete transaction history, sorted by date, with filters for symbol, trade type, and date range."

**[Screen: Switch to pgAdmin again]**

> "This data comes from the trades table, which keeps an immutable record of every transaction."

**[Action: Run query to show all user trades]**

```sql
SELECT
  t.symbol,
  t.trade_type,
  t.quantity,
  t.price,
  t.total_value,
  t.executed_at
FROM trades t
WHERE t.portfolio_id IN (
  SELECT id FROM portfolios WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@example.com'
  )
)
ORDER BY t.executed_at DESC;
```

**[Hand off to Person 4]**

---

### Person 4: Gamification & Wrap-up (4:00 - 5:00)

**[Screen: Navigate to Leaderboard]**

> "Great! Now let me show you our gamification features.
>
> We have leaderboards that rank users by portfolio performance across different time periods: daily, weekly, monthly, and all-time."

**[Action: Click through different leaderboard periods]**

> "These rankings are calculated by a background job that runs daily at midnight and hourly during market hours. The system compares each user's current portfolio value against their starting balance to calculate return percentage."

**[Screen: Switch to pgAdmin]**

> "Here's the leaderboards table showing these rankings."

**[Action: Run query]**

```sql
SELECT
  l.rank,
  u.username,
  l.return_percentage,
  l.period,
  l.snapshot_date
FROM leaderboards l
JOIN users u ON l.user_id = u.id
WHERE l.period = 'WEEKLY'
ORDER BY l.rank
LIMIT 10;
```

**[Screen: Navigate to Achievements page]**

> "We also have an achievements system to encourage user engagement. Users can unlock badges for milestones like 'First Trade,' 'Day Trader,' or 'Portfolio Millionaire.'"

**[Action: Show achievements list]**

> "When a user earns an achievement, a record is created in the user_achievements table with a timestamp."

**[Screen: Return to Dashboard]**

> "To summarize: we've built a full-stack trading simulation platform with:
> - **Authentication**: JWT-based auth with bcrypt password hashing
> - **Real Market Data**: Live prices from Alpha Vantage with intelligent caching
> - **Paper Trading**: Risk-free trading with $100,000 virtual starting balance
> - **Portfolio Tracking**: Real-time calculations of holdings and performance
> - **Gamification**: Leaderboards and achievements to drive engagement
> - **Database**: PostgreSQL with 10 tables handling users, portfolios, trades, market data, and gamification
>
> The entire system is built with TypeScript - Node.js and Express on the backend, React and Vite on the frontend, with Prisma ORM for type-safe database access.
>
> We're happy to answer any questions!"

**[End of presentation]**

---

## Database Queries

### Pre-load these queries in pgAdmin before the demo:

#### Query 1: Show Recent Trade
```sql
-- Most recent trade (Person 2)
SELECT
  t.id,
  t.symbol,
  t.trade_type,
  t.quantity,
  t.price,
  t.total_value,
  t.executed_at
FROM trades t
ORDER BY t.executed_at DESC
LIMIT 1;
```

#### Query 2: Show User Holdings
```sql
-- Current holdings for demo user (Person 3)
SELECT
  h.symbol,
  h.quantity::NUMERIC(18,2) as quantity,
  h.average_cost::NUMERIC(15,2) as avg_cost,
  h.created_at,
  h.updated_at
FROM holdings h
WHERE h.portfolio_id IN (
  SELECT id FROM portfolios WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@example.com'
  )
)
AND h.quantity > 0
ORDER BY h.created_at DESC;
```

#### Query 3: Show Trade History
```sql
-- Complete trade history for demo user (Person 3)
SELECT
  t.symbol,
  t.trade_type,
  t.quantity::NUMERIC(18,2) as quantity,
  t.price::NUMERIC(15,2) as price,
  t.total_value::NUMERIC(15,2) as total,
  TO_CHAR(t.executed_at, 'YYYY-MM-DD HH24:MI:SS') as executed_at
FROM trades t
WHERE t.portfolio_id IN (
  SELECT id FROM portfolios WHERE user_id IN (
    SELECT id FROM users WHERE email = 'demo@example.com'
  )
)
ORDER BY t.executed_at DESC
LIMIT 10;
```

#### Query 4: Show Weekly Leaderboard
```sql
-- Weekly leaderboard rankings (Person 4)
SELECT
  l.rank,
  u.username,
  l.return_percentage::NUMERIC(10,2) as return_pct,
  l.snapshot_date
FROM leaderboards l
JOIN users u ON l.user_id = u.id
WHERE l.period = 'WEEKLY'
ORDER BY l.rank
LIMIT 10;
```

#### Query 5: Show User Achievements
```sql
-- Achievements earned by demo user (Person 4)
SELECT
  a.name,
  a.description,
  a.badge_icon,
  TO_CHAR(ua.earned_at, 'YYYY-MM-DD HH24:MI:SS') as earned_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id IN (
  SELECT id FROM users WHERE email = 'demo@example.com'
)
ORDER BY ua.earned_at DESC;
```

#### Query 6: Show Portfolio Summary
```sql
-- Portfolio overview for demo user (Person 3)
SELECT
  p.name,
  p.cash_balance::NUMERIC(15,2) as cash,
  p.total_value::NUMERIC(15,2) as total_value,
  u.starting_balance::NUMERIC(15,2) as starting_balance,
  (p.total_value - u.starting_balance)::NUMERIC(15,2) as profit_loss,
  CASE
    WHEN u.starting_balance > 0 THEN
      ((p.total_value - u.starting_balance) / u.starting_balance * 100)::NUMERIC(10,2)
    ELSE 0
  END as return_percentage
FROM portfolios p
JOIN users u ON p.user_id = u.id
WHERE u.email = 'demo@example.com'
AND p.is_active = true;
```

---

## pgAdmin Setup

### Installation

**Windows**:
1. Download from [pgadmin.org](https://www.pgadmin.org/download/pgadmin-4-windows/)
2. Run installer
3. Launch pgAdmin 4

**macOS**:
```bash
brew install --cask pgadmin4
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'
sudo apt update
sudo apt install pgadmin4
```

### Connecting to Database

1. **Open pgAdmin 4**
2. **Add New Server**:
   - Right-click "Servers" → "Register" → "Server"

3. **General Tab**:
   - Name: `Stock Sim Local`

4. **Connection Tab**:
   - Host: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `<your-postgres-password>`

5. **Click "Save"**

6. **Navigate to Database**:
   - Servers → Stock Sim Local → Databases → stocksim

### Setting Up Queries

1. **Open Query Tool**:
   - Right-click `stocksim` database → "Query Tool"

2. **Create Query Tabs**:
   - Open 6 separate query tabs
   - Copy each pre-loaded query from above into separate tabs
   - Save queries with descriptive names

3. **Test Queries**:
   - Run each query to verify it works
   - Note: Some queries may return no results until demo actions are performed

### Demo View Setup

**Recommended pgAdmin Layout**:
1. Collapse left navigation panel for cleaner view
2. Open all 6 query tabs
3. Label each tab clearly (e.g., "Q1: Recent Trade")
4. Increase font size for visibility (File → Preferences → SQL Editor → Font)
5. Test switching between tabs quickly

---

## Troubleshooting

### Database Connection Issues

**pgAdmin can't connect**:
- Verify PostgreSQL is running
- Check password is correct
- Test connection via command line first:
  ```bash
  psql -U postgres -d stocksim -c "SELECT 1;"
  ```

**Query returns empty results**:
- Verify database was seeded: `npm run seed` in backend
- Check demo account exists:
  ```sql
  SELECT * FROM users WHERE email = 'demo@example.com';
  ```

### Application Issues

**Backend not starting**:
```bash
cd backend
npm run dev
```
Check for errors in console. Common issues:
- PostgreSQL not running
- Redis not running
- `.env` file missing or incorrect

**Frontend not loading**:
```bash
cd frontend
npm run dev
```
Check that backend is running on port 3001.

**Market data not loading**:
- Alpha Vantage API key may be invalid or rate-limited
- Application should automatically fall back to Yahoo Finance
- Check backend logs for API errors

### During Demo

**Trade execution fails**:
- Ensure sufficient cash balance ($100,000 starting)
- Check if market is open (use popular symbols like AAPL, MSFT, GOOGL)
- Verify API key is valid

**Query returns no data**:
- You may need to execute the trade first
- Refresh the query after performing actions in the UI
- Check that you're querying the correct user (demo@example.com)

**Screen sharing lag**:
- Close unnecessary applications
- Use wired connection if possible
- Reduce pgAdmin font size if needed for performance

---

## Tips for Success

### Before Demo
- **Practice the full demo 2-3 times**
- **Test all queries with actual data**
- **Verify all services are running**
- **Have a backup plan if API fails** (show cached data)
- **Print this script or have it open on second screen**

### During Demo
- **Speak clearly and at moderate pace**
- **Point to elements on screen as you discuss them**
- **Keep pgAdmin queries ready to execute**
- **Don't rush - 5 minutes is enough if well-rehearsed**
- **Have Person 2 start backend/frontend while Person 1 introduces**

### Timing Checkpoints
- 1:00 - Person 1 should be logging in
- 2:30 - Person 2 should be showing database query
- 4:00 - Person 3 should be handing off to Person 4
- 4:45 - Person 4 should be wrapping up

### Handling Questions
- **Technical questions**: Defer complex questions to Q&A
- **Architecture questions**: Mention tech stack (Node.js, React, PostgreSQL, Prisma)
- **Security questions**: Highlight bcrypt hashing, JWT tokens, Prisma ORM preventing SQL injection

---

## Alternative Demo Flow (If Time Permits)

If you have extra time or want to show additional features:

1. **Show sell order** (Person 2):
   - Sell some of the shares just bought
   - Show holdings quantity decrease in database

2. **Show achievements unlock** (Person 4):
   - If "First Trade" achievement unlocked, show it
   - Query user_achievements table

3. **Show market data cache** (Person 2):
   - Query market_data_cache table
   - Explain TTL and caching strategy

4. **Show background jobs** (Person 4):
   - Mention leaderboard recalculation cron jobs
   - Show scheduledJobs.ts code if time permits

---

## Post-Demo Q&A Preparation

**Expected Questions**:

**Q: How do you handle API rate limits?**
> A: We use a three-tier caching system: Redis (5 min), PostgreSQL (30 min), and only hit external APIs as a last resort. We also have fallback APIs - if Alpha Vantage is rate-limited, we automatically switch to Yahoo Finance.

**Q: Is this production-ready?**
> A: This is a functional prototype with core features complete. For production, we'd add: WebSocket for real-time updates, more comprehensive testing, monitoring/logging infrastructure, and deploy to a cloud platform with CI/CD.

**Q: What about security?**
> A: We implement industry-standard security: bcrypt password hashing with 12 salt rounds, JWT authentication with token expiry, Prisma ORM preventing SQL injection, input validation with Zod schemas, and rate limiting on sensitive endpoints.

**Q: How scalable is this?**
> A: The architecture supports horizontal scaling. PostgreSQL can be replicated, Redis can be clustered, and the Node.js backend can run multiple instances behind a load balancer. We use connection pooling and efficient indexing for database performance.

**Q: What was the biggest challenge?**
> A: Managing API rate limits while providing a smooth user experience. We solved this with intelligent caching and fallback APIs. Another challenge was accurately calculating portfolio values in real-time across potentially hundreds of holdings.

---

**Demo Version**: 1.0.0
**Last Updated**: October 2025
**Estimated Preparation Time**: 30 minutes
**Recommended Practice Runs**: 3
