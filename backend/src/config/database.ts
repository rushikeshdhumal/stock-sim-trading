import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Handle connection errors - attempt connection but don't crash if it fails
    // Prisma will auto-connect on first query
    prisma.$connect()
      .then(() => {
        logger.info('Database connection established');
      })
      .catch((error) => {
        logger.warn('Database connection failed, will retry on first query:', error.message);
      });
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
