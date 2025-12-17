/**
 * Redis Configuration
 *
 * Manages Redis connection for caching market data and session storage.
 * Implements singleton pattern to ensure single Redis connection instance.
 * Provides helper functions for common cache operations.
 */

import Redis from 'ioredis';
import logger from './logger';

// Singleton Redis client instance
let redisClient: Redis | null = null;

/**
 * Get Redis Client Instance
 *
 * Returns the singleton Redis client for cache operations.
 * Creates a new connection on first call with automatic retry strategy.
 *
 * @returns {Redis} Singleton Redis client instance
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Create Redis client with retry configuration
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      // Exponential backoff retry strategy
      // Delay increases with each retry: 50ms, 100ms, 150ms... up to 2000ms max
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Log connection events
    redisClient.on('connect', () => {
      logger.info('Redis connection established');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
};

/**
 * Disconnect Redis
 *
 * Gracefully closes the Redis connection.
 * Should be called during application shutdown.
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Get Cached Value
 *
 * Retrieves a value from Redis cache by key.
 *
 * @param {string} key - Cache key
 * @returns {Promise<string | null>} Cached value or null if not found
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  const client = getRedisClient();
  return await client.get(key);
};

/**
 * Set Cached Value
 *
 * Stores a value in Redis cache with optional TTL (time-to-live).
 *
 * @param {string} key - Cache key
 * @param {string} value - Value to cache (must be string, use JSON.stringify for objects)
 * @param {number} [ttlSeconds] - Optional TTL in seconds. If not provided, key persists indefinitely
 */
export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> => {
  const client = getRedisClient();
  if (ttlSeconds) {
    // Set with expiration
    await client.setex(key, ttlSeconds, value);
  } else {
    // Set without expiration
    await client.set(key, value);
  }
};

/**
 * Delete Cached Value
 *
 * Removes a key-value pair from Redis cache.
 *
 * @param {string} key - Cache key to delete
 */
export const cacheDel = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

/**
 * Flush All Cache
 *
 * Clears all data from the current Redis database.
 * WARNING: This operation is irreversible and affects all cached data.
 */
export const cacheFlush = async (): Promise<void> => {
  const client = getRedisClient();
  await client.flushdb();
};

export default getRedisClient;
