# Database Schema - Entity Relationship Diagram

This document contains the Mermaid ERD diagram for the Stock Trading Simulation database schema.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Portfolio : "owns"
    User ||--o{ Leaderboard : "ranked in"
    User ||--o{ UserAchievement : "earns"
    User ||--o{ UserChallenge : "participates in"
    User ||--o{ Watchlist : "watches"

    Portfolio ||--o{ Holding : "contains"
    Portfolio ||--o{ Trade : "executes"
    Portfolio ||--o{ Leaderboard : "tracked in"
    Portfolio ||--o{ UserChallenge : "used for"

    Achievement ||--o{ UserAchievement : "awarded as"
    Challenge ||--o{ UserChallenge : "has participants"

    User {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar passwordHash
        decimal startingBalance
        datetime createdAt
        datetime updatedAt
    }

    Portfolio {
        uuid id PK
        uuid userId FK
        varchar name
        decimal cashBalance
        decimal totalValue
        datetime createdAt
        boolean isActive
    }

    Holding {
        uuid id PK
        uuid portfolioId FK
        varchar symbol
        enum assetType "STOCK"
        decimal quantity
        decimal averageCost
        datetime createdAt
        datetime updatedAt
    }

    Trade {
        uuid id PK
        uuid portfolioId FK
        varchar symbol
        enum assetType "STOCK"
        enum tradeType "BUY, SELL"
        decimal quantity
        decimal price
        decimal totalValue
        datetime executedAt
    }

    MarketDataCache {
        uuid id PK
        varchar symbol UK
        enum assetType "STOCK"
        decimal currentPrice
        decimal change24h
        bigint volume
        bigint marketCap
        datetime lastUpdated
    }

    Leaderboard {
        uuid id PK
        uuid userId FK
        uuid portfolioId FK
        enum period "DAILY, WEEKLY, MONTHLY, ALL_TIME"
        decimal returnPercentage
        int rank
        date snapshotDate
        datetime createdAt
    }

    Achievement {
        uuid id PK
        varchar name UK
        text description
        varchar badgeIcon
        varchar criteriaType
        json criteriaValue
        datetime createdAt
    }

    UserAchievement {
        uuid id PK
        uuid userId FK
        uuid achievementId FK
        datetime earnedAt
    }

    Challenge {
        uuid id PK
        varchar name
        text description
        enum challengeType "BEAT_MARKET, TOP_PERCENTAGE, SPECIFIC_RETURN"
        decimal targetValue
        date startDate
        date endDate
        boolean isActive
    }

    UserChallenge {
        uuid id PK
        uuid userId FK
        uuid challengeId FK
        uuid portfolioId FK
        enum status "ACTIVE, COMPLETED, FAILED"
        decimal progress
        datetime joinedAt
        datetime completedAt
    }

    Watchlist {
        uuid id PK
        uuid userId FK
        varchar symbol
        enum assetType "STOCK"
        datetime addedAt
        text notes
    }
```

## Key Relationships

### User Relationships
- **User → Portfolio**: One user can have multiple portfolios (1:N)
- **User → Leaderboard**: One user can have multiple leaderboard entries across different periods (1:N)
- **User → UserAchievement**: One user can earn multiple achievements (1:N)
- **User → UserChallenge**: One user can participate in multiple challenges (1:N)
- **User → Watchlist**: One user can watch multiple assets (1:N)

### Portfolio Relationships
- **Portfolio → Holding**: One portfolio contains multiple holdings (1:N)
- **Portfolio → Trade**: One portfolio executes multiple trades (1:N)
- **Portfolio → Leaderboard**: One portfolio can be ranked in multiple leaderboard periods (1:N)
- **Portfolio → UserChallenge**: One portfolio can be used in multiple challenges (1:N)

### Achievement & Challenge Relationships
- **Achievement → UserAchievement**: One achievement can be earned by multiple users (1:N)
- **Challenge → UserChallenge**: One challenge can have multiple participants (1:N)

## Unique Constraints

1. **User**
   - `username` (unique)
   - `email` (unique)

2. **Holding**
   - `(portfolioId, symbol)` - Each portfolio can only have one holding per symbol

3. **MarketDataCache**
   - `symbol` (unique) - Only one cache entry per symbol

4. **Achievement**
   - `name` (unique)

5. **UserAchievement**
   - `(userId, achievementId)` - User can only earn each achievement once

6. **Watchlist**
   - `(userId, symbol)` - User can only watch each symbol once

7. **UserChallenge**
   - `(userId, challengeId)` - User can only participate in each challenge once

## Indexes

### Performance Optimization Indexes

**User Table:**
- `email` - For login lookups
- `username` - For profile lookups

**Portfolio Table:**
- `userId` - For fetching user's portfolios

**Holding Table:**
- `portfolioId` - For fetching portfolio holdings
- `symbol` - For symbol-based queries

**Trade Table:**
- `portfolioId` - For fetching portfolio trade history
- `executedAt` - For time-based queries
- `symbol` - For symbol-specific trade history

**MarketDataCache Table:**
- `symbol` - For quick price lookups
- `assetType` - For filtering by asset type

**Leaderboard Table:**
- `(period, rank)` - For leaderboard queries
- `snapshotDate` - For historical leaderboards
- `userId` - For user leaderboard history

**UserAchievement Table:**
- `userId` - For fetching user's achievements

**UserChallenge Table:**
- `userId` - For fetching user's challenges
- `challengeId` - For fetching challenge participants

**Watchlist Table:**
- `userId` - For fetching user's watchlist

## Cascade Deletion Rules

All foreign key relationships use `onDelete: Cascade`, meaning:

- Deleting a **User** will delete all their:
  - Portfolios
  - Leaderboard entries
  - UserAchievements
  - UserChallenges
  - Watchlist items

- Deleting a **Portfolio** will delete all its:
  - Holdings
  - Trades
  - Leaderboard entries
  - UserChallenge associations

- Deleting an **Achievement** will delete all:
  - UserAchievement records

- Deleting a **Challenge** will delete all:
  - UserChallenge records

## Enums

### AssetType
- `STOCK` - Stock assets only

### TradeType
- `BUY` - Purchase order
- `SELL` - Sell order

### LeaderboardPeriod
- `DAILY` - Daily rankings
- `WEEKLY` - Weekly rankings
- `MONTHLY` - Monthly rankings
- `ALL_TIME` - All-time rankings

### ChallengeType
- `BEAT_MARKET` - Beat market benchmark
- `TOP_PERCENTAGE` - Rank in top percentage
- `SPECIFIC_RETURN` - Achieve specific return target

### ChallengeStatus
- `ACTIVE` - Challenge in progress
- `COMPLETED` - Challenge successfully completed
- `FAILED` - Challenge failed
