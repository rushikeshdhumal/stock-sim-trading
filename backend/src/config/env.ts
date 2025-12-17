/**
 * Environment Configuration
 *
 * Validates and exports environment variables using Zod schema validation.
 * Ensures all required environment variables are present and properly formatted.
 * Application will exit with error if validation fails.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Variables Schema
 *
 * Defines the structure and validation rules for all environment variables.
 * Required variables must be present in .env file.
 * Optional variables have default values.
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Database Configuration
  DATABASE_URL: z.string(), // Required: PostgreSQL connection string

  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT Authentication
  JWT_SECRET: z.string(), // Required: Secret key for access tokens
  JWT_EXPIRES_IN: z.string().default('7d'), // Access token validity period
  JWT_REFRESH_SECRET: z.string(), // Required: Secret key for refresh tokens
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'), // Refresh token validity period

  // External API Keys
  ALPHA_VANTAGE_API_KEY: z.string().optional(), // Primary market data source
  FINNHUB_API_KEY: z.string().optional(), // Fallback market data source

  // CORS Configuration
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes in milliseconds
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'), // Max requests per window

  // Caching
  MARKET_DATA_CACHE_TTL: z.string().default('300'), // Cache duration in seconds (5 minutes default)
});

/**
 * Parse and Validate Environment Variables
 *
 * Attempts to parse environment variables against the schema.
 * If validation fails, prints detailed error messages and exits the application.
 *
 * @returns {z.infer<typeof envSchema>} Validated environment variables
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

// Validated environment variables - safe to use throughout the application
export const env = parseEnv();

export default env;
