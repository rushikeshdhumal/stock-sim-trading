import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.userAchievement.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.marketDataCache.deleteMany();
  await prisma.user.deleteMany();

  // Seed Achievements
  console.log('Seeding achievements...');
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: 'First Trade',
        description: 'Execute your first trade',
        badgeIcon: '🎯',
        criteriaType: 'trade_count',
        criteriaValue: { min: 1 },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Week Warrior',
        description: 'Achieve positive returns for a full week',
        badgeIcon: '📈',
        criteriaType: 'weekly_return',
        criteriaValue: { min: 0 },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Beat the Market',
        description: 'Outperform S&P 500 in a month',
        badgeIcon: '🏆',
        criteriaType: 'beat_sp500',
        criteriaValue: { period: 'monthly' },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Diamond Hands',
        description: 'Hold a position for 30+ days',
        badgeIcon: '💎',
        criteriaType: 'hold_duration',
        criteriaValue: { min_days: 30 },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Day Trader',
        description: 'Complete 10 trades in a single day',
        badgeIcon: '⚡',
        criteriaType: 'daily_trades',
        criteriaValue: { min: 10 },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Diversified',
        description: 'Hold 10+ different assets',
        badgeIcon: '🌐',
        criteriaType: 'unique_holdings',
        criteriaValue: { min: 10 },
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Top 10%',
        description: 'Reach top 10% on any leaderboard',
        badgeIcon: '⭐',
        criteriaType: 'leaderboard_rank',
        criteriaValue: { percentile: 10 },
      },
    }),
  ]);
  console.log(`✅ Created ${achievements.length} achievements`);

  // Seed Challenges
  console.log('Seeding challenges...');
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const challenges = await Promise.all([
    prisma.challenge.create({
      data: {
        name: 'Monthly Bulls',
        description: 'Achieve 5% return this month',
        challengeType: 'SPECIFIC_RETURN',
        targetValue: 5.0,
        startDate: now,
        endDate: nextMonth,
        isActive: true,
      },
    }),
    prisma.challenge.create({
      data: {
        name: 'Top 10 Challenge',
        description: 'Finish in top 10 this week',
        challengeType: 'TOP_PERCENTAGE',
        targetValue: 10,
        startDate: now,
        endDate: nextWeek,
        isActive: true,
      },
    }),
    prisma.challenge.create({
      data: {
        name: 'Beat the Index',
        description: 'Outperform the market benchmark',
        challengeType: 'BEAT_MARKET',
        targetValue: null,
        startDate: now,
        endDate: nextMonth,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${challenges.length} challenges`);

  // Seed Market Data Cache (sample data)
  console.log('Seeding market data cache...');
  const marketData = await Promise.all([
    prisma.marketDataCache.create({
      data: {
        symbol: 'AAPL',
        assetType: 'STOCK',
        currentPrice: 178.25,
        change24h: 2.15,
        volume: BigInt(75000000),
        marketCap: BigInt(2800000000000),
        lastUpdated: new Date(),
      },
    }),
    prisma.marketDataCache.create({
      data: {
        symbol: 'GOOGL',
        assetType: 'STOCK',
        currentPrice: 142.50,
        change24h: -1.25,
        volume: BigInt(35000000),
        marketCap: BigInt(1750000000000),
        lastUpdated: new Date(),
      },
    }),
    prisma.marketDataCache.create({
      data: {
        symbol: 'MSFT',
        assetType: 'STOCK',
        currentPrice: 385.00,
        change24h: 3.50,
        volume: BigInt(25000000),
        marketCap: BigInt(2850000000000),
        lastUpdated: new Date(),
      },
    }),
    prisma.marketDataCache.create({
      data: {
        symbol: 'TSLA',
        assetType: 'STOCK',
        currentPrice: 242.50,
        change24h: -5.75,
        volume: BigInt(125000000),
        marketCap: BigInt(770000000000),
        lastUpdated: new Date(),
      },
    }),
    prisma.marketDataCache.create({
      data: {
        symbol: 'BTC',
        assetType: 'CRYPTO',
        currentPrice: 43250.00,
        change24h: 1250.00,
        volume: BigInt(28000000000),
        marketCap: BigInt(850000000000),
        lastUpdated: new Date(),
      },
    }),
    prisma.marketDataCache.create({
      data: {
        symbol: 'ETH',
        assetType: 'CRYPTO',
        currentPrice: 2280.00,
        change24h: 85.50,
        volume: BigInt(15000000000),
        marketCap: BigInt(275000000000),
        lastUpdated: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${marketData.length} market data entries`);

  // Seed Demo Users
  console.log('Seeding demo users...');
  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const demoUser1 = await prisma.user.create({
    data: {
      username: 'demo_trader',
      email: 'demo@stocksim.com',
      passwordHash,
      startingBalance: 100000,
    },
  });

  const demoUser2 = await prisma.user.create({
    data: {
      username: 'investor_pro',
      email: 'pro@stocksim.com',
      passwordHash,
      startingBalance: 100000,
    },
  });

  const demoUser3 = await prisma.user.create({
    data: {
      username: 'crypto_king',
      email: 'crypto@stocksim.com',
      passwordHash,
      startingBalance: 100000,
    },
  });

  console.log('✅ Created 3 demo users');

  // Seed Portfolios
  console.log('Seeding portfolios...');
  const portfolio1 = await prisma.portfolio.create({
    data: {
      userId: demoUser1.id,
      name: 'Main Portfolio',
      cashBalance: 85000,
      totalValue: 115000,
      isActive: true,
    },
  });

  const portfolio2 = await prisma.portfolio.create({
    data: {
      userId: demoUser2.id,
      name: 'Growth Strategy',
      cashBalance: 60000,
      totalValue: 125000,
      isActive: true,
    },
  });

  const portfolio3 = await prisma.portfolio.create({
    data: {
      userId: demoUser3.id,
      name: 'Crypto Focus',
      cashBalance: 50000,
      totalValue: 108000,
      isActive: true,
    },
  });

  console.log('✅ Created 3 portfolios');

  // Seed Holdings
  console.log('Seeding holdings...');
  await prisma.holding.createMany({
    data: [
      {
        portfolioId: portfolio1.id,
        symbol: 'AAPL',
        assetType: 'STOCK',
        quantity: 50,
        averageCost: 175.00,
      },
      {
        portfolioId: portfolio1.id,
        symbol: 'GOOGL',
        assetType: 'STOCK',
        quantity: 30,
        averageCost: 140.00,
      },
      {
        portfolioId: portfolio2.id,
        symbol: 'MSFT',
        assetType: 'STOCK',
        quantity: 100,
        averageCost: 380.00,
      },
      {
        portfolioId: portfolio2.id,
        symbol: 'TSLA',
        assetType: 'STOCK',
        quantity: 20,
        averageCost: 250.00,
      },
      {
        portfolioId: portfolio3.id,
        symbol: 'BTC',
        assetType: 'CRYPTO',
        quantity: 1.2,
        averageCost: 42000.00,
      },
      {
        portfolioId: portfolio3.id,
        symbol: 'ETH',
        assetType: 'CRYPTO',
        quantity: 8,
        averageCost: 2200.00,
      },
    ],
  });
  console.log('✅ Created sample holdings');

  // Seed Trades
  console.log('Seeding trade history...');
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await prisma.trade.createMany({
    data: [
      {
        portfolioId: portfolio1.id,
        symbol: 'AAPL',
        assetType: 'STOCK',
        tradeType: 'BUY',
        quantity: 50,
        price: 175.00,
        totalValue: 8750.00,
        executedAt: yesterday,
      },
      {
        portfolioId: portfolio1.id,
        symbol: 'GOOGL',
        assetType: 'STOCK',
        tradeType: 'BUY',
        quantity: 30,
        price: 140.00,
        totalValue: 4200.00,
        executedAt: yesterday,
      },
      {
        portfolioId: portfolio2.id,
        symbol: 'MSFT',
        assetType: 'STOCK',
        tradeType: 'BUY',
        quantity: 100,
        price: 380.00,
        totalValue: 38000.00,
        executedAt: yesterday,
      },
    ],
  });
  console.log('✅ Created sample trades');

  // Award some achievements
  console.log('Awarding sample achievements...');
  await prisma.userAchievement.create({
    data: {
      userId: demoUser1.id,
      achievementId: achievements[0].id, // First Trade
    },
  });
  console.log('✅ Awarded achievements');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nDemo Login Credentials:');
  console.log('Email: demo@stocksim.com');
  console.log('Password: Demo123!');
  console.log('\nOther demo accounts:');
  console.log('- pro@stocksim.com / Demo123!');
  console.log('- crypto@stocksim.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
