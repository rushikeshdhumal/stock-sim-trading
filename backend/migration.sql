-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('STOCK', 'CRYPTO');

-- CreateEnum
CREATE TYPE "trade_type" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "leaderboard_period" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "challenge_type" AS ENUM ('BEAT_MARKET', 'TOP_PERCENTAGE', 'SPECIFIC_RETURN');

-- CreateEnum
CREATE TYPE "challenge_status" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "starting_balance" DECIMAL(15,2) NOT NULL DEFAULT 100000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "cash_balance" DECIMAL(15,2) NOT NULL,
    "total_value" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "asset_type" "asset_type" NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "average_cost" DECIMAL(15,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "asset_type" "asset_type" NOT NULL,
    "trade_type" "trade_type" NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "price" DECIMAL(15,4) NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data_cache" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "asset_type" "asset_type" NOT NULL,
    "current_price" DECIMAL(15,4),
    "change_24h" DECIMAL(10,4),
    "volume" BIGINT,
    "market_cap" BIGINT,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_data_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "period" "leaderboard_period" NOT NULL,
    "return_percentage" DECIMAL(10,4) NOT NULL,
    "rank" INTEGER NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "badge_icon" VARCHAR(255),
    "criteria_type" VARCHAR(50) NOT NULL,
    "criteria_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "challenge_type" "challenge_type" NOT NULL,
    "target_value" DECIMAL(10,4),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "status" "challenge_status" NOT NULL DEFAULT 'ACTIVE',
    "progress" DECIMAL(10,4),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "portfolios_user_id_idx" ON "portfolios"("user_id");

-- CreateIndex
CREATE INDEX "holdings_portfolio_id_idx" ON "holdings"("portfolio_id");

-- CreateIndex
CREATE INDEX "holdings_symbol_idx" ON "holdings"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_portfolio_id_symbol_key" ON "holdings"("portfolio_id", "symbol");

-- CreateIndex
CREATE INDEX "trades_portfolio_id_idx" ON "trades"("portfolio_id");

-- CreateIndex
CREATE INDEX "trades_executed_at_idx" ON "trades"("executed_at");

-- CreateIndex
CREATE INDEX "trades_symbol_idx" ON "trades"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_cache_symbol_key" ON "market_data_cache"("symbol");

-- CreateIndex
CREATE INDEX "market_data_cache_symbol_idx" ON "market_data_cache"("symbol");

-- CreateIndex
CREATE INDEX "market_data_cache_asset_type_idx" ON "market_data_cache"("asset_type");

-- CreateIndex
CREATE INDEX "leaderboards_period_rank_idx" ON "leaderboards"("period", "rank");

-- CreateIndex
CREATE INDEX "leaderboards_snapshot_date_idx" ON "leaderboards"("snapshot_date");

-- CreateIndex
CREATE INDEX "leaderboards_user_id_idx" ON "leaderboards"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "achievements"("name");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "user_challenges_user_id_idx" ON "user_challenges"("user_id");

-- CreateIndex
CREATE INDEX "user_challenges_challenge_id_idx" ON "user_challenges"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenges_user_id_challenge_id_key" ON "user_challenges"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

