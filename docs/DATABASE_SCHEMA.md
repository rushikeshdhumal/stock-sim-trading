# Database Schema Documentation

Complete database schema reference for the Stock Market Simulation & Trading Game.

**Database**: PostgreSQL 14+
**ORM**: Prisma
**Schema Location**: `backend/prisma/schema.prisma`

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Enums](#enums)
5. [Indexes](#indexes)
6. [Relationships](#relationships)
7. [Data Types](#data-types)
8. [Constraints](#constraints)

---

## Overview

The database consists of **11 main tables** organized into four functional areas:

### Core User & Portfolio Management
- `users` - User accounts and authentication
- `portfolios` - User portfolios with cash balances
- `holdings` - Current asset positions
- `trades` - Complete transaction history
- `watchlists` - User's favorite assets for monitoring

### Market Data
- `market_data_cache` - Cached stock/crypto prices

### Gamification
- `leaderboards` - User rankings by period
- `achievements` - Achievement definitions
- `user_achievements` - Earned achievements
- `challenges` - Active challenges
- `user_challenges` - Challenge participation

---

## Entity Relationship Diagram

```
                              ┌─────────────┐
                              │    users    │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┬────────────────┬────────────────┐
                    │ 1:N            │ 1:N            │ 1:N            │ 1:N            │ 1:N
                    ▼                ▼                ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │ portfolios  │  │ watchlists  │  │leaderboards │  │user_achieve.│  │user_challen.│
            └──────┬──────┘  └─────────────┘  └─────────────┘  └─────┬───────┘  └─────┬───────┘
                   │                                                 │                │
        ┌──────────┼──────────┐                                      │ N:1            │ N:1
        │ 1:N      │ 1:N      │ 1:N                                  │                │
        ▼          ▼          ▼                                      ▼                ▼
   ┌─────────┐┌─────────┐┌─────────┐                           ┌─────────────┐  ┌─────────────┐
   │holdings ││ trades  ││leaderb. │                           │achievements │  │ challenges  │
   └─────────┘└─────────┘└─────────┘                           └─────────────┘  └─────────────┘
                                      
                                         
                              ┌──────────────────┐
                              │market_data_cache │  (standalone cache table)
                              └──────────────────┘
```

---

## Tables

### 1. users

User accounts and authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Username (alphanumeric + underscore) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hashed password (12 rounds) |
| `starting_balance` | DECIMAL(15,2) | DEFAULT 100000 | Initial cash balance for new portfolios |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `email`
- Index on `username`

**Relationships**:
- One-to-Many with `portfolios`
- One-to-Many with `leaderboards`
- One-to-Many with `user_achievements`
- One-to-Many with `user_challenges`

**Sample Row**:
```sql
id: 550e8400-e29b-41d4-a716-446655440000
username: johndoe
email: john@example.com
password_hash: $2b$12$KIX...
starting_balance: 100000.00
created_at: 2025-10-21 10:00:00
updated_at: 2025-10-21 10:00:00
```

---

### 2. portfolios

User portfolios for managing investments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique portfolio identifier |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | References users(id) |
| `name` | VARCHAR(100) | NOT NULL | Portfolio name |
| `cash_balance` | DECIMAL(15,2) | NOT NULL | Available cash for trading |
| `total_value` | DECIMAL(15,2) | NULLABLE | Total portfolio value (cash + holdings) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether portfolio is active |

**Indexes**:
- Primary key on `id`
- Index on `user_id`

**Relationships**:
- Many-to-One with `users`
- One-to-Many with `holdings`
- One-to-Many with `trades`
- One-to-Many with `leaderboards`
- One-to-Many with `user_challenges`

**Constraints**:
- `ON DELETE CASCADE` on user_id (delete portfolio when user is deleted)

**Sample Row**:
```sql
id: 660e8400-e29b-41d4-a716-446655440001
user_id: 550e8400-e29b-41d4-a716-446655440000
name: Main Portfolio
cash_balance: 95000.50
total_value: 105234.75
created_at: 2025-10-21 10:00:00
is_active: true
```

---

### 3. holdings

Current asset positions (stocks/crypto).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique holding identifier |
| `portfolio_id` | UUID | FOREIGN KEY, NOT NULL | References portfolios(id) |
| `symbol` | VARCHAR(20) | NOT NULL | Stock/crypto ticker symbol |
| `asset_type` | ENUM | NOT NULL | STOCK or CRYPTO |
| `quantity` | DECIMAL(18,8) | NOT NULL | Number of shares/coins owned |
| `average_cost` | DECIMAL(15,4) | NOT NULL | Average purchase price per unit |
| `created_at` | TIMESTAMP | DEFAULT NOW() | First purchase timestamp |
| `updated_at` | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `portfolio_id`
- Index on `symbol`
- Unique constraint on `(portfolio_id, symbol)` - one holding per symbol per portfolio

**Relationships**:
- Many-to-One with `portfolios`

**Constraints**:
- `ON DELETE CASCADE` on portfolio_id
- Unique constraint on (portfolio_id, symbol)

**Sample Row**:
```sql
id: 770e8400-e29b-41d4-a716-446655440002
portfolio_id: 660e8400-e29b-41d4-a716-446655440001
symbol: AAPL
asset_type: STOCK
quantity: 50.00000000
average_cost: 150.2500
created_at: 2025-10-21 14:00:00
updated_at: 2025-10-21 16:30:00
```

---

### 4. trades

Complete transaction history (buy/sell orders).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique trade identifier |
| `portfolio_id` | UUID | FOREIGN KEY, NOT NULL | References portfolios(id) |
| `symbol` | VARCHAR(20) | NOT NULL | Stock/crypto ticker symbol |
| `asset_type` | ENUM | NOT NULL | STOCK or CRYPTO |
| `trade_type` | ENUM | NOT NULL | BUY or SELL |
| `quantity` | DECIMAL(18,8) | NOT NULL | Number of shares/coins traded |
| `price` | DECIMAL(15,4) | NOT NULL | Price per unit at execution |
| `total_value` | DECIMAL(15,2) | NOT NULL | Total transaction value (quantity × price) |
| `executed_at` | TIMESTAMP | DEFAULT NOW() | Trade execution timestamp |

**Indexes**:
- Primary key on `id`
- Index on `portfolio_id`
- Index on `executed_at` (for time-based queries)
- Index on `symbol`

**Relationships**:
- Many-to-One with `portfolios`

**Constraints**:
- `ON DELETE CASCADE` on portfolio_id

**Sample Row**:
```sql
id: 880e8400-e29b-41d4-a716-446655440003
portfolio_id: 660e8400-e29b-41d4-a716-446655440001
symbol: AAPL
asset_type: STOCK
trade_type: BUY
quantity: 10.00000000
price: 175.5000
total_value: 1755.00
executed_at: 2025-10-21 14:30:00
```

---

### 5. watchlists

User's favorite assets for monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique watchlist entry identifier |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | References users(id) |
| `symbol` | VARCHAR(20) | NOT NULL | Stock/crypto ticker symbol |
| `asset_type` | ENUM | NOT NULL | STOCK or CRYPTO |
| `added_at` | TIMESTAMP | DEFAULT NOW() | When symbol was added |
| `notes` | TEXT | NULLABLE | Optional user notes |

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `symbol`
- Unique constraint on `(user_id, symbol)` - one entry per symbol per user

**Relationships**:
- Many-to-One with `users`

**Constraints**:
- `ON DELETE CASCADE` on user_id
- Unique constraint on (user_id, symbol)

**Sample Row**:
```sql
id: ff0e8400-e29b-41d4-a716-446655440010
user_id: 550e8400-e29b-41d4-a716-446655440000
symbol: AAPL
asset_type: STOCK
added_at: 2025-12-16 10:00:00
notes: Tech giant - monitoring for dip
```

---

### 6. market_data_cache

Cached stock and cryptocurrency prices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique cache entry identifier |
| `symbol` | VARCHAR(20) | UNIQUE, NOT NULL | Stock/crypto ticker symbol |
| `asset_type` | ENUM | NOT NULL | STOCK or CRYPTO |
| `current_price` | DECIMAL(15,4) | NULLABLE | Current price per unit |
| `change_24h` | DECIMAL(10,4) | NULLABLE | 24-hour price change (absolute) |
| `volume` | BIGINT | NULLABLE | 24-hour trading volume |
| `market_cap` | BIGINT | NULLABLE | Market capitalization |
| `last_updated` | TIMESTAMP | NOT NULL | Cache timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `symbol`
- Index on `asset_type`

**Cache TTL**:
- Redis: 5 minutes (300s)
- Database: 30 minutes (1800s)

**Sample Row**:
```sql
id: 990e8400-e29b-41d4-a716-446655440004
symbol: AAPL
asset_type: STOCK
current_price: 175.5000
change_24h: 2.7500
volume: 65432100
market_cap: 2750000000000
last_updated: 2025-10-21 15:30:00
```

---

### 7. leaderboards

User rankings by time period.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique leaderboard entry identifier |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | References users(id) |
| `portfolio_id` | UUID | FOREIGN KEY, NOT NULL | References portfolios(id) |
| `period` | ENUM | NOT NULL | DAILY, WEEKLY, MONTHLY, ALL_TIME |
| `return_percentage` | DECIMAL(10,4) | NOT NULL | Portfolio return percentage |
| `rank` | INTEGER | NOT NULL | User's rank for this period |
| `snapshot_date` | DATE | NOT NULL | Date of ranking snapshot |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |

**Indexes**:
- Primary key on `id`
- Composite index on `(period, rank)` - for fast ranking queries
- Index on `snapshot_date`
- Index on `user_id`

**Relationships**:
- Many-to-One with `users`
- Many-to-One with `portfolios`

**Constraints**:
- `ON DELETE CASCADE` on user_id and portfolio_id

**Sample Row**:
```sql
id: aa0e8400-e29b-41d4-a716-446655440005
user_id: 550e8400-e29b-41d4-a716-446655440000
portfolio_id: 660e8400-e29b-41d4-a716-446655440001
period: WEEKLY
return_percentage: 5.2300
rank: 42
snapshot_date: 2025-10-21
created_at: 2025-10-21 16:00:00
```

---

### 8. achievements

Achievement definitions for gamification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique achievement identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Achievement name |
| `description` | TEXT | NOT NULL | Achievement description |
| `badge_icon` | VARCHAR(255) | NULLABLE | Emoji or icon identifier |
| `criteria_type` | VARCHAR(50) | NOT NULL | Type of achievement (e.g., "first_trade") |
| `criteria_value` | JSON | NOT NULL | Criteria configuration |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `name`

**Relationships**:
- One-to-Many with `user_achievements`

**Sample Row**:
```sql
id: bb0e8400-e29b-41d4-a716-446655440006
name: First Trade
description: Execute your first trade
badge_icon: 🎯
criteria_type: first_trade
criteria_value: {"min_trades": 1}
created_at: 2025-10-01 00:00:00
```

---

### 9. user_achievements

User's earned achievements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique entry identifier |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | References users(id) |
| `achievement_id` | UUID | FOREIGN KEY, NOT NULL | References achievements(id) |
| `earned_at` | TIMESTAMP | DEFAULT NOW() | Achievement unlock timestamp |

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Unique constraint on `(user_id, achievement_id)` - can't earn same achievement twice

**Relationships**:
- Many-to-One with `users`
- Many-to-One with `achievements`

**Constraints**:
- `ON DELETE CASCADE` on user_id and achievement_id
- Unique constraint on (user_id, achievement_id)

**Sample Row**:
```sql
id: cc0e8400-e29b-41d4-a716-446655440007
user_id: 550e8400-e29b-41d4-a716-446655440000
achievement_id: bb0e8400-e29b-41d4-a716-446655440006
earned_at: 2025-10-21 14:30:00
```

---

### 10. challenges

Time-bound trading challenges.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique challenge identifier |
| `name` | VARCHAR(100) | NOT NULL | Challenge name |
| `description` | TEXT | NOT NULL | Challenge description |
| `challenge_type` | ENUM | NOT NULL | BEAT_MARKET, TOP_PERCENTAGE, SPECIFIC_RETURN |
| `target_value` | DECIMAL(10,4) | NULLABLE | Target value to achieve |
| `start_date` | DATE | NOT NULL | Challenge start date |
| `end_date` | DATE | NOT NULL | Challenge end date |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether challenge is active |

**Indexes**:
- Primary key on `id`

**Relationships**:
- One-to-Many with `user_challenges`

**Sample Row**:
```sql
id: dd0e8400-e29b-41d4-a716-446655440008
name: Tech Stock Challenge
description: Maximum returns trading only tech stocks
challenge_type: TOP_PERCENTAGE
target_value: 10.0000
start_date: 2025-10-20
end_date: 2025-10-27
is_active: true
```

---

### 11. user_challenges

User participation in challenges.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique entry identifier |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | References users(id) |
| `challenge_id` | UUID | FOREIGN KEY, NOT NULL | References challenges(id) |
| `portfolio_id` | UUID | FOREIGN KEY, NOT NULL | References portfolios(id) |
| `status` | ENUM | DEFAULT ACTIVE | ACTIVE, COMPLETED, FAILED |
| `progress` | DECIMAL(10,4) | NULLABLE | Current progress percentage |
| `joined_at` | TIMESTAMP | DEFAULT NOW() | Join timestamp |
| `completed_at` | TIMESTAMP | NULLABLE | Completion/failure timestamp |

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `challenge_id`
- Unique constraint on `(user_id, challenge_id)` - can't join same challenge twice

**Relationships**:
- Many-to-One with `users`
- Many-to-One with `challenges`
- Many-to-One with `portfolios`

**Constraints**:
- `ON DELETE CASCADE` on user_id, challenge_id, and portfolio_id
- Unique constraint on (user_id, challenge_id)

**Sample Row**:
```sql
id: ee0e8400-e29b-41d4-a716-446655440009
user_id: 550e8400-e29b-41d4-a716-446655440000
challenge_id: dd0e8400-e29b-41d4-a716-446655440008
portfolio_id: 660e8400-e29b-41d4-a716-446655440001
status: ACTIVE
progress: 4.5000
joined_at: 2025-10-21 10:00:00
completed_at: NULL
```

---

## Enums

### AssetType
Asset classification for holdings and trades.

```sql
CREATE TYPE asset_type AS ENUM ('STOCK', 'CRYPTO');
```

**Values**:
- `STOCK` - Traditional stocks (AAPL, TSLA, etc.)
- `CRYPTO` - Cryptocurrencies (BTC, ETH, etc.)

---

### TradeType
Trade direction.

```sql
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');
```

**Values**:
- `BUY` - Purchase order
- `SELL` - Sell order

---

### LeaderboardPeriod
Time period for rankings.

```sql
CREATE TYPE leaderboard_period AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');
```

**Values**:
- `DAILY` - Rankings for current day
- `WEEKLY` - Rankings for current week
- `MONTHLY` - Rankings for current month
- `ALL_TIME` - All-time rankings

---

### ChallengeType
Challenge completion criteria.

```sql
CREATE TYPE challenge_type AS ENUM ('BEAT_MARKET', 'TOP_PERCENTAGE', 'SPECIFIC_RETURN');
```

**Values**:
- `BEAT_MARKET` - Beat a market benchmark (e.g., S&P 500)
- `TOP_PERCENTAGE` - Finish in top X% of participants
- `SPECIFIC_RETURN` - Achieve specific return percentage

---

### ChallengeStatus
User's status in a challenge.

```sql
CREATE TYPE challenge_status AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');
```

**Values**:
- `ACTIVE` - Currently participating
- `COMPLETED` - Successfully completed
- `FAILED` - Failed to meet criteria

---

## Indexes

### Primary Indexes (Automatic)
All tables have a PRIMARY KEY on `id` (UUID).

### Foreign Key Indexes
- `portfolios.user_id`
- `holdings.portfolio_id`
- `trades.portfolio_id`
- `leaderboards.user_id`, `leaderboards.portfolio_id`
- `user_achievements.user_id`
- `user_challenges.user_id`, `user_challenges.challenge_id`

### Unique Indexes
- `users.username`
- `users.email`
- `market_data_cache.symbol`
- `achievements.name`
- `holdings(portfolio_id, symbol)` - composite unique
- `user_achievements(user_id, achievement_id)` - composite unique
- `user_challenges(user_id, challenge_id)` - composite unique

### Performance Indexes
- `trades.executed_at` - for time-based queries
- `trades.symbol` - for symbol-specific trade history
- `holdings.symbol` - for symbol lookups
- `leaderboards(period, rank)` - composite for ranking queries
- `leaderboards.snapshot_date` - for date-based queries
- `market_data_cache.asset_type` - for filtering by asset type

---

## Relationships

### One-to-Many Relationships

**User → Portfolios**
- One user can have multiple portfolios
- Cascade delete: Delete user → delete all their portfolios

**User → Leaderboards**
- One user can have multiple leaderboard entries (different periods)
- Cascade delete: Delete user → delete all their rankings

**User → User Achievements**
- One user can earn multiple achievements
- Cascade delete: Delete user → delete all their achievements

**User → User Challenges**
- One user can participate in multiple challenges
- Cascade delete: Delete user → delete all their participations

**User → Watchlists**
- One user can watch multiple assets
- Cascade delete: Delete user → delete all their watchlist entries

**Portfolio → Holdings**
- One portfolio can have multiple holdings
- Cascade delete: Delete portfolio → delete all its holdings

**Portfolio → Trades**
- One portfolio can have multiple trades
- Cascade delete: Delete portfolio → delete all its trades

**Achievement → User Achievements**
- One achievement definition can be earned by multiple users
- Cascade delete: Delete achievement → delete all user unlocks

**Challenge → User Challenges**
- One challenge can have multiple participants
- Cascade delete: Delete challenge → delete all participations

---

## Data Types

### UUID
All primary keys use UUID v4 for:
- Global uniqueness
- Security (non-sequential)
- Distribution support

### DECIMAL
Financial values use DECIMAL for precision:
- `DECIMAL(15,2)` - Currency values (e.g., $12,345.67)
- `DECIMAL(15,4)` - Asset prices (e.g., $123.4567)
- `DECIMAL(18,8)` - Quantities (supports fractional shares/crypto)
- `DECIMAL(10,4)` - Percentages (e.g., 12.3456%)

**Why DECIMAL over FLOAT**: Exact precision for financial calculations, no rounding errors.

### TIMESTAMP
All timestamps include timezone information and millisecond precision.

### VARCHAR Limits
- `username`: 50 chars
- `email`: 255 chars
- `symbol`: 20 chars (ticker symbols)
- `portfolio.name`: 100 chars
- `achievement.name`: 100 chars

---

## Constraints

### Cascade Delete Policies

All foreign key relationships use `ON DELETE CASCADE`:
- Delete user → Deletes portfolios, leaderboards, achievements, challenges
- Delete portfolio → Deletes holdings and trades
- Delete achievement → Deletes user achievement unlocks
- Delete challenge → Deletes user participations

**Rationale**: Maintain referential integrity and prevent orphaned records.

### Unique Constraints

1. **users.username** - Prevent duplicate usernames
2. **users.email** - Prevent duplicate emails (used for login)
3. **market_data_cache.symbol** - One cache entry per symbol
4. **achievements.name** - Unique achievement names
5. **holdings(portfolio_id, symbol)** - One holding per symbol per portfolio
6. **watchlists(user_id, symbol)** - One watchlist entry per symbol per user
7. **user_achievements(user_id, achievement_id)** - Can't earn same achievement twice
8. **user_challenges(user_id, challenge_id)** - Can't join same challenge twice

### Default Values

- `users.starting_balance`: 100000.00
- `portfolios.is_active`: true
- `challenges.is_active`: true
- `user_challenges.status`: ACTIVE
- All `created_at`: NOW()
- All `updated_at`: Auto-update on modification

---

## Database Management

### Prisma Commands

**Generate Client**:
```bash
npx prisma generate
```

**Push Schema** (Development):
```bash
npx prisma db push
```

**Create Migration** (Production):
```bash
npx prisma migrate dev --name migration_name
```

**Deploy Migrations**:
```bash
npx prisma migrate deploy
```

**Open Prisma Studio** (GUI):
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Useful Queries

**Count users**:
```sql
SELECT COUNT(*) FROM users;
```

**Total portfolio value**:
```sql
SELECT SUM(cash_balance + COALESCE(total_value, 0))
FROM portfolios WHERE is_active = true;
```

**Most traded symbols**:
```sql
SELECT symbol, COUNT(*) as trade_count
FROM trades
GROUP BY symbol
ORDER BY trade_count DESC
LIMIT 10;
```

**User's total returns**:
```sql
SELECT
  u.username,
  p.name as portfolio_name,
  p.cash_balance,
  p.total_value,
  (p.total_value - u.starting_balance) as profit_loss,
  ((p.total_value - u.starting_balance) / u.starting_balance * 100) as return_pct
FROM users u
JOIN portfolios p ON u.id = p.user_id
WHERE u.id = '<user_id>';
```

**Active holdings with current value**:
```sql
SELECT
  h.symbol,
  h.quantity,
  h.average_cost,
  m.current_price,
  (h.quantity * m.current_price) as current_value,
  ((m.current_price - h.average_cost) / h.average_cost * 100) as profit_loss_pct
FROM holdings h
LEFT JOIN market_data_cache m ON h.symbol = m.symbol
WHERE h.portfolio_id = '<portfolio_id>' AND h.quantity > 0;
```

---

## Performance Considerations

### Indexing Strategy
- All foreign keys are indexed for JOIN performance
- Composite indexes on frequently queried combinations (period, rank)
- Time-based indexes for historical queries

### Query Optimization
- Use `LIMIT` for pagination
- Use `SELECT` specific columns instead of `SELECT *`
- Leverage indexes in WHERE clauses
- Use prepared statements (Prisma handles this)

### Connection Pooling
Prisma automatically manages connection pooling:
- Default pool size: 10 connections
- Configurable via DATABASE_URL parameter

### Data Archival
Consider archiving old trades/leaderboards after 1+ year for performance.

---

**Schema Version**: 1.1.0
**Last Updated**: December 2025
**Prisma Version**: 5.22.0
