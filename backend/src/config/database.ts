/**
 * Database Configuration
 *
 * Manages PostgreSQL database connection using Prisma ORM.
 * Implements singleton pattern to ensure single database connection instance.
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton Prisma Client instance
let prisma: PrismaClient;

/**
 * Get Prisma Client Instance
 *
 * Returns the singleton Prisma client for database operations.
 * Creates a new instance on first call with appropriate logging configuration.
 *
 * @returns {PrismaClient} Singleton Prisma client instance
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    // Create Prisma client with environment-specific logging
    // Development: Log queries, errors, and warnings for debugging
    // Production: Only log errors to reduce noise
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Attempt initial connection
    // Prisma will auto-reconnect on first query if this fails
    // This allows the application to start even if database is temporarily unavailable
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

/**
 * Disconnect Database
 *
 * Gracefully closes the database connection.
 * Should be called during application shutdown.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

export default getPrismaClient;
