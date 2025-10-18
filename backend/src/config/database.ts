import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Handle connection errors
    prisma.$connect().catch((error) => {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    });

    logger.info('Database connection established');
  }

  return prisma;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

export default getPrismaClient;
